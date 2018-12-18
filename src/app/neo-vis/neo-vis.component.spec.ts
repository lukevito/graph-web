import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeoVisComponent } from './neo-vis.component';

describe('NeoVisComponent', () => {
  let component: NeoVisComponent;
  let fixture: ComponentFixture<NeoVisComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeoVisComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeoVisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
