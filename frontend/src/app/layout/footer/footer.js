import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
let FooterComponent = class FooterComponent {
    year = new Date().getFullYear();
};
FooterComponent = __decorate([
    Component({
        selector: 'app-footer',
        standalone: true,
        imports: [RouterLink, MatButtonModule],
        templateUrl: './footer.html',
        styleUrl: './footer.scss',
    })
], FooterComponent);
export { FooterComponent };
