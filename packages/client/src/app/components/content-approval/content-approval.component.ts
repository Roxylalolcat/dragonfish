import { Component, Input, OnInit } from '@angular/core';
import { ReadingHistory, RatingOption } from '@pulp-fiction/models/reading-history';
import { ContentKind, SetRating } from '@pulp-fiction/models/content';
import { ContentService } from '../../services/content';
import { AuthService } from '../../services/auth';
import { FrontendUser } from '@pulp-fiction/models/users';
import { MatDialog } from '@angular/material/dialog';
import { AddToCollectionComponent } from '../modals/collections';

@Component({
    selector: 'content-approval',
    templateUrl: './content-approval.component.html',
    styleUrls: ['./content-approval.component.less']
})
export class ContentApprovalComponent implements OnInit {
    @Input() content: any;
    @Input() histData: ReadingHistory;

    currentUser: FrontendUser;
    contentKind = ContentKind;

    constructor(private contentService: ContentService, private auth: AuthService, private dialog: MatDialog) {
        this.auth.currUser.subscribe(x => { this.currentUser = x; })
    }

    ngOnInit(): void {}

    /**
     * Opens the Add To Collection dialog box.
     */
    openAddToCollectionDialog() {
        const dialogRef = this.dialog.open(AddToCollectionComponent, {data: {content: this.content}});
    }

    /**
     * Sets this user's rating as Liked.
     * 
     * @param contentId The content ID
     * @param currRating The current rating
     */
    setLike(contentId: string, currRating: RatingOption) {
        const ratingOptions: SetRating = {
            workId: contentId,
            oldApprovalRating: currRating
        };

        this.contentService.setLike(ratingOptions).subscribe(() => {
            this.histData.ratingOption = RatingOption.Liked;
            if (currRating === RatingOption.Disliked) {
                this.content.stats.dislikes -= 1;
            } else {
                this.content.stats.likes += 1;
            }
        });
    }

    /**
     * Sets this user's rating as Disliked.
     * 
     * @param contentId The content ID
     * @param currRating The current rating
     */
    setDislike(contentId: string, currRating: RatingOption) {
        const ratingOptions: SetRating = {
            workId: contentId,
            oldApprovalRating: currRating
        };

        this.contentService.setDislike(ratingOptions).subscribe(() => {
            this.histData.ratingOption = RatingOption.Disliked;
            if (currRating === RatingOption.Liked) {
                this.content.stats.likes -= 1;
            } else {
                this.content.stats.dislikes += 1;
            }
        });
    }

    /**
     * Sets this user's rating as NoVote.
     * 
     * @param contentId The content ID
     * @param currRating The current rating
     */
    setNoVote(contentId: string, currRating: RatingOption) {
        const ratingOptions: SetRating = {
            workId: contentId,
            oldApprovalRating: currRating
        };

        this.contentService.setNoVote(ratingOptions).subscribe(() => {
            this.histData.ratingOption = RatingOption.NoVote;
            if (currRating === RatingOption.Liked) {
                this.content.stats.likes -= 1;
            } else if (currRating === RatingOption.Disliked) {
                this.content.stats.dislikes -= 1;
            }
        });
    }
}