import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-catalog',
  standalone: true,
  imports: [CommonModule],
  template: `<h1>Product Catalog</h1>`,
})
export class ProductCatalogComponent {}
