Co do zrobienia:


-duplikacja komponentu z grafem (Patryk)
-zapamietywanie query (razew) (Tomek)
-wyswietlanie wyników (response json) (Łukasz)

-szczegóły node wyświetlane po jego kliknięciu 
-error loging 
-klastering dla benów http://visjs.org/examples/network/other/changingClusteredEdgesNodes.html



## Zmiana koloru okna windows

https://www.howtogeek.com/258162/how-to-add-color-to-inactive-title-bars-in-windows-10/

`regedit`

`Komputer\HKEY_CURRENT_USER\Software\Microsoft\Windows\DWM`

`AccentColorInactive` `565656`

## ng create commands

`ng g c nav`

`ng g c contact`

`ng g c home`

`ng g c about`


<h1 [ngClass]="{
  'deepskyblue': h1Style,
  'pink': !h1Style
}">class test</h1>
<h1 [ngStyle]="{
  'color': h1Style ? 'pink' : 'black',
  'font-size': h1Style ? '12px' : '24px'
}">style test</h1>


# GraphWeb

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.3.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
