import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feature-toggles',
  standalone: true,
  imports: [CommonModule],
  template: `<h1>Feature Toggles</h1>`,
})
export class FeatureTogglesComponent {}
