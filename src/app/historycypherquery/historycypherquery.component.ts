import {Component, Inject, OnInit} from '@angular/core';
import {MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef} from "@angular/material";
import {HomeComponent} from "../home/home.component";

@Component({
  selector: 'app-historycypherquery',
  templateUrl: './historycypherquery.component.html',
  styleUrls: ['./historycypherquery.component.scss']
})
export class HistorycypherqueryComponent implements OnInit {

  constructor(private bottomSheetRef: MatBottomSheetRef<HomeComponent>, @Inject(MAT_BOTTOM_SHEET_DATA) public data: Array<string>) { }

  ngOnInit() {
  }

  openLink(event: MouseEvent, selectedQuery: string): void {
    this.bottomSheetRef.dismiss(selectedQuery);
    event.preventDefault();
  }

}
