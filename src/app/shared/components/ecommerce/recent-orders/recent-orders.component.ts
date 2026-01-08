// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-recent-orders',
//   imports: [CommonModule],
//   templateUrl: './recent-orders.component.html',
//   styleUrl: './recent-orders.component.css'
// })
// export class RecentOrdersComponent {

// }


import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
// import { TableComponent } from '../../ui/table/table.component';
// import { TableBodyComponent } from '../../ui/table/table-body.component';
// import { TableCellComponent } from '../../ui/table/table-cell.component';
// import { TableHeaderComponent } from '../../ui/table/table-header.component';
// import { TableRowComponent } from '../../ui/table/table-row.component';
import { BadgeComponent } from '../../ui/badge/badge.component';

interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  price: string;
  status: 'Delivered' | 'Pending' | 'Canceled';
}

@Component({
  selector: 'app-recent-orders',
  imports: [
    CommonModule,
    // TableComponent,
    // TableBodyComponent,
    // TableCellComponent,
    // TableHeaderComponent,
    // TableRowComponent,
    BadgeComponent,
  ],
  templateUrl: './recent-orders.component.html'
})
export class RecentOrdersComponent {
  tableData: Product[] = [
    {
      id: 1,
      name: "Anillo de Diamante 18k",
      variants: "2 Variantes",
      category: "Anillos",
      price: "$2399.00",
      status: "Delivered",
    },
    {
      id: 2,
      name: "Reloj de Oro Premium",
      variants: "1 Variante",
      category: "Relojes",
      price: "$879.00",
      status: "Pending",
    },
    {
      id: 3,
      name: "Collar de Perlas",
      variants: "2 Variantes",
      category: "Collares",
      price: "$1869.00",
      status: "Delivered",
    },
    {
      id: 4,
      name: "Pulsera de Plata",
      variants: "2 Variantes",
      category: "Pulseras",
      price: "$1699.00",
      status: "Canceled",
    },
    {
      id: 5,
      name: "Aretes de Rubí",
      variants: "1 Variante",
      category: "Aretes",
      price: "$240.00",
      status: "Delivered",
    },
  ];

  getBadgeColor(status: string): 'success' | 'warning' | 'error' {
    if (status === 'Delivered') return 'success';
    if (status === 'Pending') return 'warning';
    return 'error';
  }
}