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

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private data: DataService, private resolver: ComponentFactoryResolver) { }

  @ViewChild('neoContainer', { read: ViewContainerRef }) container: ViewContainerRef;

  h1Style: boolean = false;
  cypherQuery: string;

  users: Object;

  ngOnInit() {
    this.data.getUserData().subscribe(data => {
      this.users = data;
      console.log(this.users)
    });
  }

  sendCypherQuery() {
    const factory = this.resolver.resolveComponentFactory(NeoVisComponent);
    const neoVisComponentComponentRef = this.container.createComponent(factory, 0);
    neoVisComponentComponentRef.instance.cypherQuery = this.cypherQuery;
  }
}
