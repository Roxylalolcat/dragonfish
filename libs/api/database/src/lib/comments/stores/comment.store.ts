import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PaginateModel, PaginateResult, PaginateOptions } from 'mongoose';
import { CommentDocument, ContentCommentDocument } from '../schemas';
import { CommentForm, CommentKind } from '@dragonfish/shared/models/comments';
import { JwtPayload } from '@dragonfish/shared/models/auth';
import { isNullOrUndefined } from '@dragonfish/shared/functions';

@Injectable()
export class CommentStore {
    constructor(
        @InjectModel('Comment') private readonly comments: PaginateModel<CommentDocument>,
        @InjectModel('ContentComment') private readonly contentComments: PaginateModel<ContentCommentDocument>,
    ) {}

    /**
     * Fetches comments by page
     * @param itemId
     * @param kind
     * @param pageNum
     * @returns
     */
    public async fetch(itemId: string, kind: CommentKind, pageNum: number): Promise<PaginateResult<CommentDocument>> {
        const options: PaginateOptions = { sort: { createdAt: 1 }, limit: 25, page: pageNum };
        switch (kind) {
            case CommentKind.ContentComment:
                return await this.contentComments.paginate({ contentId: itemId }, options);
            case CommentKind.ThreadComment:
                throw new InternalServerErrorException(`This functionality is not yet supported.`);
        }
    }

    /**
     * Creates a new comment.
     * @param user
     * @param itemId
     * @param kind
     * @param form
     * @returns
     */
    public async create(
        user: JwtPayload,
        itemId: string,
        kind: CommentKind,
        form: CommentForm,
    ): Promise<CommentDocument> {
        const newComment = await this.createDocument(user.sub, itemId, kind, form);
        return await newComment.save();
    }

    /**
     * Submits edits for a comment, saving the old comment body into the `history` array.
     * @param user
     * @param commentId
     * @param form
     * @returns
     */
    public async edit(user: JwtPayload, commentId: string, form: CommentForm): Promise<CommentDocument> {
        const comment = await this.comments.findById(commentId).where({ user: user.sub });

        if (isNullOrUndefined(comment)) {
            throw new NotFoundException(`The comment you're trying to edit doesn't seem to exist.`);
        } else {
            comment.history.push(<any>{ oldBody: comment.body });
            comment.body = form.body;
            comment.repliesTo = form.repliesTo;

            return await comment.save();
        }
    }

    //#region ---PRIVATE---

    /**
     * Creates a comment document based on its comment kind.
     * @param userId
     * @param itemId
     * @param kind
     * @param form
     * @returns
     */
    private async createDocument(
        userId: string,
        itemId: string,
        kind: CommentKind,
        form: CommentForm,
    ): Promise<CommentDocument> {
        switch (kind) {
            case CommentKind.ContentComment:
                return new this.contentComments({
                    user: userId,
                    body: form.body,
                    repliesTo: form.repliesTo,
                    contentId: itemId,
                });
            case CommentKind.ThreadComment:
                throw new InternalServerErrorException(`This feature has not yet been implemented.`);
        }
    }

    //#endregion
}