import { Component, OnInit, Input } from '@angular/core';
import { GridMenuItem } from './grid-menu';

@Component({
  selector: 'ygg-grid-menu',
  templateUrl: './grid-menu.component.html',
  styleUrls: ['./grid-menu.component.css']
})
export class GridMenuComponent implements OnInit {
  @Input() menuItems: GridMenuItem[];

  constructor() {
    this.menuItems = [];
  }

  ngOnInit() {
  }

}
