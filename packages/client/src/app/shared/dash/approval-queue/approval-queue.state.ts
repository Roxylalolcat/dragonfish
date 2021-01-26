import { Injectable } from '@angular/core';
import { State, Action, Selector, StateContext, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { append, patch, removeItem } from '@ngxs/store/operators';

import { AQNamespace } from './approval-queue.actions';
import { ApprovalQueueStateModel } from './approval-queue-state.model';
import { ApprovalQueueService } from './services';
import { ApprovalQueue } from '@pulp-fiction/models/approval-queue';
import { PaginateResult } from '@pulp-fiction/models/util';
import { UserState } from '../../user';
import { FrontendUser } from '@pulp-fiction/models/users';
import { PoetryContent, ProseContent, SectionInfo } from '@pulp-fiction/models/content';
import { Section } from '@pulp-fiction/models/sections';
import { Alerts } from '../../alerts';

@State<ApprovalQueueStateModel>({
    name: 'approvalQueue',
    defaults: {
        currPageDocs: null,
        claimedDocs: [],
        selectedDoc: null,
        selectedDocSections: null,
        selectedDocSection: null
    }
})
@Injectable()
export class ApprovalQueueState {
    constructor (private queueService: ApprovalQueueService, private store: Store) {}

    /* Actions */

    @Action(AQNamespace.GetQueue)
    getQueue({ patchState, dispatch }: StateContext<ApprovalQueueStateModel>, { pageNum }: AQNamespace.GetQueue): Observable<PaginateResult<ApprovalQueue>> {
        return this.queueService.getQueue(pageNum).pipe(tap((result: PaginateResult<ApprovalQueue>) => {
            const currUser: FrontendUser | null = this.store.selectSnapshot(UserState.currUser);
            if (currUser !== null) {
                // current behavior will reset the `claimedDocs` every time the page changes; this will be addressed 
                // in a future update to determine if docs have already been added to the array
                const ownedDocs = result.docs.filter((doc: any) => { return doc.claimedBy !== null && doc.claimedBy._id === currUser._id });
                patchState({
                    currPageDocs: result,
                    claimedDocs: ownedDocs
                });
                return 
            } else {
                dispatch(new Alerts.Error(`This action is forbidden.`));
            }
        }));
    }

    @Action(AQNamespace.GetQueueForMod)
    getQueueForMod({ dispatch }: StateContext<ApprovalQueueStateModel>, _action: AQNamespace.GetQueueForMod) {
        dispatch(new Alerts.Info(`Action not yet supported.`));
    }

    @Action(AQNamespace.ClaimWork)
    claimWork({ setState }: StateContext<ApprovalQueueStateModel>, { doc }: AQNamespace.ClaimWork): Observable<ApprovalQueue> {
        return this.queueService.claimWork(doc._id).pipe(tap((result: ApprovalQueue) => {
            setState(patch({
                claimedDocs: append([result])
            }));
        }));
    }

    @Action(AQNamespace.SelectWork)
    selectWork({ patchState }: StateContext<ApprovalQueueStateModel>, { doc }: AQNamespace.SelectWork): void {
        const work = doc.workToApprove as ProseContent | PoetryContent;
        patchState({
            selectedDoc: doc,
            selectedDocSections: work.sections as SectionInfo[]
        });
    }

    @Action(AQNamespace.FetchSection)
    fetchSection({ patchState }: StateContext<ApprovalQueueStateModel>, { sectionId }: AQNamespace.FetchSection) {
        return this.queueService.fetchSection(sectionId).pipe(tap((val: Section) => {
            patchState({
                selectedDocSection: val
            });
        }));
    }

    @Action(AQNamespace.ApproveWork)
    approveWork({ setState }: StateContext<ApprovalQueueStateModel>, { decision }: AQNamespace.ApproveWork) {
        return this.queueService.approveWork(decision).pipe(tap((_result: void) => {
            setState(patch({
                claimedDocs: removeItem<ApprovalQueue>(doc => doc._id === decision.docId),
                selectedDoc: null
            }));
        }));
    }

    @Action(AQNamespace.RejectWork)
    rejectWork({ setState }: StateContext<ApprovalQueueStateModel>, { decision }: AQNamespace.RejectWork) {
        return this.queueService.rejectWork(decision).pipe(tap((_result: void) => {
            setState(patch({
                claimedDocs: removeItem<ApprovalQueue>(doc => doc._id === decision.docId),
                selectedDoc: null
            }));
        }));
    }

    @Action(AQNamespace.ViewContent)
    viewContent({ dispatch }: StateContext<ApprovalQueueStateModel>) {
        dispatch(new Alerts.Info(`Action not yet supported.`));
    }

    /* Selectors */

    @Selector()
    static currPageDocs (state: ApprovalQueueStateModel): PaginateResult<ApprovalQueue> | null {
        return state.currPageDocs;
    }

    @Selector()
    static claimedDocs (state: ApprovalQueueStateModel): ApprovalQueue[] {
        return state.claimedDocs;
    }

    @Selector()
    static selectedDoc (state: ApprovalQueueStateModel): ApprovalQueue | null {
        return state.selectedDoc;
    }

    @Selector()
    static selectedDocSections (state: ApprovalQueueStateModel): SectionInfo[] | null {
        return state.selectedDocSections;
    }

    @Selector()
    static selectedDocSection (state: ApprovalQueueStateModel): Section | null {
        return state.selectedDocSection;
    }
}