import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';

import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from "@angular/common/http";
import {ReactiveFormsModule} from "@angular/forms";

import {AppRoutingModule} from './app-routing.module';

import {ContactComponent} from './contact/contact.component';
import {NavComponent} from './nav/nav.component';
import {HomeComponent} from './home/home.component';
import {AboutComponent} from './about/about.component';

@NgModule({
  declarations: [
    AppComponent,
    ContactComponent,
    NavComponent,
    HomeComponent,
    AboutComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
