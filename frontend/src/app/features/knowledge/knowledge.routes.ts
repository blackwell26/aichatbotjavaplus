import { Routes } from '@angular/router';

export const knowledgeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'documents',
  },
  {
    path: 'documents',
    data: { breadcrumb: 'Documents' },
    loadComponent: () =>
      import('./pages/document-list/document-list').then(
        (m) => m.DocumentListComponent
      ),
  },
  {
    path: 'documents/:id',
    data: { breadcrumb: 'Document detail' },
    loadComponent: () =>
      import('./pages/document-detail/document-detail').then(
        (m) => m.DocumentDetailComponent
      ),
  },
  {
    path: 'test',
    data: { breadcrumb: 'Test' },
    loadComponent: () =>
      import('./pages/knowledge-test/knowledge-test').then(
        (m) => m.KnowledgeTestComponent
      ),
  },
];
