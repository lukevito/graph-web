import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {

  private submitted: boolean;
  private success: boolean;

  messageForm: FormGroup;

  constructor(private formBuilder: FormBuilder) {
    this.messageForm = formBuilder.group({
      name: ['', Validators.required],
      message: ['', Validators.required]
    });
  }

  onSubmit() {
    this.submitted = true;
    if (this.messageForm.invalid ) {
      return;
    }
    this.success = true;
  }

  ngOnInit() {
  }

}
