import { ContentModel, SectionInfo } from '@pulp-fiction/models/content';
import { ReadingHistory } from '@pulp-fiction/models/reading-history';
import { Section } from '@pulp-fiction/models/sections';
import { PaginateResult } from '@pulp-fiction/models/util';

export interface ContentStateModel {
    currPageContent: PaginateResult<ContentModel> | null;
    currContent: ContentModel | null;
    currHistDoc: ReadingHistory | null;
    currSections: SectionInfo[] | null;
    currSection: Section | null;
    likes: number;
    dislikes: number;
}