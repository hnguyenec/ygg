import { every, isEmpty } from 'lodash';
import { Component, forwardRef, Input, OnDestroy } from '@angular/core';
import { debounceTime } from 'rxjs/operators';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  FormControl,
  FormGroupDirective,
  NgForm,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormGroup,
  FormBuilder,
  AbstractControl,
  ControlValueAccessor,
  Validator,
  FormArray
} from '@angular/forms';
import { Contact } from '@ygg/shared/omni-types/core';
import { Subscription } from 'rxjs';
import { User } from '@ygg/shared/user/core';
import { AuthenticateService } from '@ygg/shared/user/ui';

class LeastRequireErrorMatcher implements ErrorStateMatcher {
  fields: string[];
  errorMessage: string;

  constructor(fields: string[], errorMessage?: string) {
    this.fields = fields;
    this.errorMessage =
      errorMessage || `Please fill at least one of ${fields.join(', ')}`;
  }

  validator(formGroup: FormGroup | FormArray): any {
    if (every(this.fields, field => isEmpty(formGroup.get(field).value))) {
      return {
        leastRequire: true
      };
    } else {
      return null;
    }
  }

  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    if (!control) {
      return false;
    }
    if (!control.touched) {
      return false;
    } else {
      if (control.invalid) {
        return true;
      }
      return this.validator(control.parent);
    }
  }
}

@Component({
  selector: 'ygg-contact-control',
  templateUrl: './contact-control.component.html',
  styleUrls: ['./contact-control.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ContactControlComponent),
      multi: true
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => ContactControlComponent),
      multi: true
    }
  ]
})
export class ContactControlComponent
  implements OnDestroy, ControlValueAccessor, Validator {
  contactForm: FormGroup;
  leastRequireErrorMatcher = new LeastRequireErrorMatcher(
    ['email', 'phone', 'lineID'],
    '請至少留下電話、Email、LINE ID其中一種聯絡方式'
  );
  emitChange: (contact: Contact) => any;
  user: User;
  subscriptions: Subscription[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthenticateService
  ) {
    this.contactForm = this.formBuilder.group(
      {
        name: '',
        phone: '',
        email: '',
        lineID: ''
      },
      {
        validator: formGroup =>
          this.leastRequireErrorMatcher.validator(formGroup)
      }
    );
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => (this.user = user))
    );
  }

  ngOnDestroy() {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
  }

  writeValue(contact: Contact) {
    if (Contact.isContact(contact)) {
      this.contactForm.reset();
      this.contactForm.patchValue(contact);
    }
  }

  registerOnChange(fn) {
    this.emitChange = fn;
    // alert('registerOnChange!!!');
    this.subscriptions.push(
      this.contactForm.valueChanges
        // .pipe(debounceTime(500))
        .subscribe(contactValue => {
          // console.log('Contact changed~!!!');
          const contact = new Contact().fromJSON(contactValue);
          // console.log(contact);
          this.emitChange(contact);
        })
    );
  }

  registerOnTouched(fn) {}

  importFromUser() {
    if (this.user) {
      const contact = new Contact().fromUser(this.user);
      this.contactForm.patchValue(contact);
    }
  }
  // requireEmailOrPhoneValidator(formGroup: FormGroup): any {
  //   if (formGroup.get('phone').value || formGroup.get('email').value) {
  //     return null;
  //   } else {
  //     return {
  //       requireEmailOrPhone: true
  //     };
  //   }
  // }

  public validate(c: AbstractControl): { [key: string]: any } {
    // console.log('I am called');
    if (this.contactForm.invalid) {
      const errors = {};
      for (const key in this.contactForm.controls) {
        if (this.contactForm.controls.hasOwnProperty(key)) {
          const control = this.contactForm.controls[key];
          control.markAsTouched({ onlySelf: true });
          errors[key] = control.errors;
        }
      }
      // console.dir(errors);
      return errors;
    } else {
      return null;
    }
  }
}
