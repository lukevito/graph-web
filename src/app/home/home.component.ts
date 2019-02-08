import {
  Component,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  ViewContainerRef,
  ComponentRef
} from '@angular/core';
import {DataService} from "../data.service";
import {NeoVisComponent} from "../neo-vis/neo-vis.component";
import {MatBottomSheet} from "@angular/material";
import {HistorycypherqueryComponent} from "../historycypherquery/historycypherquery.component";

@Component({
  preserveWhitespaces: true,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private data: DataService, private resolver: ComponentFactoryResolver, private bottomSheet: MatBottomSheet) { }

  @ViewChild('neoContainer', { read: ViewContainerRef }) container: ViewContainerRef;

  h1Style: boolean = false;
  cypherQuery: string;
  cypherQueryLog = new Array();

  users: Object;

  ngOnInit() {
    this.data.getUserData().subscribe(data => {
      this.users = data;
      console.log(this.users)
    });
  }

  showCypherQueryHistory(): void {
    this.bottomSheet.open(HistorycypherqueryComponent, {
      data: this.cypherQueryLog,
    })
        .afterDismissed().subscribe (data => {
      this.cypherQuery = data;
    });
  }

  sendCypherQuery() {
    this.cypherQueryLog.push(this.cypherQuery);
    const factory = this.resolver.resolveComponentFactory(NeoVisComponent);
    const neoVisComponentComponentRef = this.container.createComponent(factory, 0);
    neoVisComponentComponentRef.instance.cypherQuery = this.cypherQuery;
  }
}
