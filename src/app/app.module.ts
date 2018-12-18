import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';

import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";

import {AppRoutingModule} from './app-routing.module';

import {ContactComponent} from './contact/contact.component';
import {HomeComponent} from './home/home.component';
import {AboutComponent} from './about/about.component';
import { NavComponent } from './nav/nav.component';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import  {MaterialComponentsImportModule} from "./material-components-import/material-components-import.module";
import { NeoVisComponent } from './neo-vis/neo-vis.component';

// https://coursetro.com/posts/code/171/Angular-7-Tutorial---Learn-Angular-7-by-Example
@NgModule({
  declarations: [
    AppComponent,
    ContactComponent,
    HomeComponent,
    AboutComponent,
    NavComponent,
    NeoVisComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialComponentsImportModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
