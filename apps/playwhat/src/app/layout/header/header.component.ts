import { Component, OnInit } from '@angular/core';
import { ImitationTourPlan } from '@ygg/playwhat/core';

@Component({
  selector: 'pw-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  ImitationTourPlan = ImitationTourPlan;
  
  constructor() { }

  ngOnInit() {
  }

}
