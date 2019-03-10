import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { TestShoppingComponent } from './shopping/test-shopping/test-shopping.component';
import { AppRouteModule } from './app-route.module';
import { ShoppingCartModule } from '@ygg/shopping/cart';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { environment } from 'apps/deep-travel/src/environments/environment';
// import { AngularFireModule } from '@angular/fire';

@NgModule({
  declarations: [AppComponent, TestShoppingComponent],
  imports: [
    BrowserModule,
    AppRouteModule,
    ShoppingCartModule
    // BrowserAnimationsModule,
    // AngularFireModule.initializeApp(environment.firebase)
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
