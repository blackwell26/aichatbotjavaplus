import { Routes } from '@angular/router';

export const knowledgeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'documents',
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/document-list/document-list').then(
        (m) => m.DocumentListComponent
      ),
  },
  {
    path: 'documents/:id',
    loadComponent: () =>
      import('./pages/document-detail/document-detail').then(
        (m) => m.DocumentDetailComponent
      ),
  },
  {
    path: 'test',
    loadComponent: () =>
      import('./pages/knowledge-test/knowledge-test').then(
        (m) => m.KnowledgeTestComponent
      ),
  },
];
