import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HistorycypherqueryComponent } from './historycypherquery.component';

describe('HistorycypherqueryComponent', () => {
  let component: HistorycypherqueryComponent;
  let fixture: ComponentFixture<HistorycypherqueryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistorycypherqueryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistorycypherqueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
