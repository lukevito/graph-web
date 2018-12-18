import {
  Component,
  OnInit,
  ViewChild,
  ComponentFactoryResolver,
  ViewContainerRef
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

  @ViewChild('neoContainer', { read: ViewContainerRef }) container;

  h1Style: boolean = false;

  users: Object;

  ngOnInit() {
    this.sendCypherQuery();
    this.data.getUserData().subscribe(data => {
      this.users = data;
      console.log(this.users)
    });
  }

  sendCypherQuery() {
    this.container.clear();
    const factory = this.resolver.resolveComponentFactory(NeoVisComponent);
    let neoVisComponentComponentRef = this.container.createComponent(factory);
  }
}
