import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { vi, type Mocked } from 'vitest';
import { HomeComponent } from '../features/customer/pages/home/home';
import { OrderHistoryComponent } from '../features/customer/pages/order-history/order-history';
import { OrderDetailComponent } from '../features/customer/pages/order-detail/order-detail';
import { ReturnRequestComponent } from '../features/customer/pages/return-request/return-request';
import { OrderService } from '../features/customer/services/order.service';
import { OrderDetail, OrderSummary } from '../features/customer/models/order.model';
import { ApiResponse, PagedResponse } from '../core/models/api.model';

describe('Customer workflows', () => {
  const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'home/orders', component: OrderHistoryComponent },
    { path: 'home/orders/:id', component: OrderDetailComponent },
    { path: 'home/orders/:id/return', component: ReturnRequestComponent },
  ];

  let orderService: Mocked<OrderService>;

  beforeEach(async () => {
    orderService = {
      getOrders: vi.fn(),
      getOrder: vi.fn(),
      submitReturn: vi.fn(),
    } as unknown as Mocked<OrderService>;

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        HttpClientTestingModule,
        NoopAnimationsModule,
        HomeComponent,
        OrderHistoryComponent,
        OrderDetailComponent,
        ReturnRequestComponent,
      ],
      providers: [
        provideRouter(routes),
        { provide: OrderService, useValue: orderService },
      ],
    }).compileComponents();
  });

  it('renders the customer home page with FAQ and chatbot entry points', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/home', HomeComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Shop products with support close by');
    expect(harness.routeNativeElement?.textContent).toContain('Ask for help');
    expect(harness.routeNativeElement?.textContent).toContain('View catalog');
    const chatLink = harness.routeNativeElement?.querySelector('a[routerlink="/chat"]');
    expect(chatLink).toBeTruthy();
  });

  it('shows order history and order tracking details', async () => {
    const order: OrderSummary = {
      id: 'ord-1',
      orderNumber: 'ORD-1001',
      orderDate: '2026-07-20T12:00:00Z',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      itemCount: 2,
      total: 149.99,
    };

    const detail: OrderDetail = {
      id: 'ord-1',
      orderNumber: 'ORD-1001',
      orderDate: '2026-07-20T12:00:00Z',
      status: 'SHIPPED',
      paymentStatus: 'PAID',
      subtotal: 139.99,
      tax: 10,
      shippingCost: 0,
      total: 149.99,
      itemCount: 1,
      items: [
        {
          id: 'item-1',
          productId: 'prod-1',
          productName: 'Wireless Headphones',
          sku: 'WH-001',
          quantity: 1,
          unitPrice: 99.99,
          lineTotal: 99.99,
          returnEligible: true,
        },
      ],
      shipment: {
        carrier: 'UPS',
        trackingNumber: '1Z12345',
        estimatedDelivery: '2026-07-27T12:00:00Z',
        events: [
          {
            timestamp: '2026-07-26T12:00:00Z',
            description: 'Package in transit',
            location: 'Toronto',
          },
        ],
      },
      shippingAddress: {
        fullName: 'Jamie Customer',
        line1: '123 Main St',
        line2: 'Apt 4',
        city: 'Toronto',
        state: 'ON',
        postalCode: 'M5V 2T6',
        country: 'CA',
      },
      supportTicketIds: ['T-100'],
    };

    orderService.getOrders.mockReturnValue(
      of({
        data: [order],
        page: 0,
        pageSize: 20,
        totalElements: 1,
        totalPages: 1,
      } as PagedResponse<OrderSummary>)
    );
    orderService.getOrder.mockReturnValue(of({ data: detail } as ApiResponse<OrderDetail>));

    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/home/orders', OrderHistoryComponent);

    expect(harness.routeNativeElement?.textContent).toContain('Order History');
    expect(harness.routeNativeElement?.textContent).toContain('ORD-1001');

    await harness.navigateByUrl('/home/orders/ord-1', OrderDetailComponent);
    expect(harness.routeNativeElement?.textContent).toContain('Shipment tracking');
    expect(harness.routeNativeElement?.textContent).toContain('Tracking #1Z12345');
    expect(harness.routeNativeElement?.textContent).toContain('Ask chatbot');
    expect(harness.routeNativeElement?.textContent).toContain('Return');
  });

  it('submits a return request and shows confirmation', async () => {
    orderService.submitReturn.mockReturnValue(
      of({
        data: {
          returnId: 'ret-1',
          ticketNumber: 'TICK-9001',
          message: 'Return request received.',
        },
      } as ApiResponse<{ returnId: string; ticketNumber: string; message: string }>)
    );

    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/home/orders/ord-1/return?itemId=item-1', ReturnRequestComponent);

    const form = harness.routeNativeElement?.querySelector('form');
    expect(form).toBeTruthy();

    component.form.controls.reason.setValue('DAMAGED_IN_SHIPPING');
    component.form.controls.quantity.setValue(1);
    component.form.controls.comments.setValue('Packaging was damaged on arrival.');
    (component as ReturnRequestComponent & { submit(): void }).submit();
    await Promise.resolve();

    expect(orderService.submitReturn).toHaveBeenCalledWith('ord-1', {
      orderItemId: 'item-1',
      reason: 'DAMAGED_IN_SHIPPING',
      quantity: 1,
      comments: 'Packaging was damaged on arrival.',
    });
    expect(harness.routeNativeElement?.textContent).toContain('Return request submitted');
    expect(harness.routeNativeElement?.textContent).toContain('TICK-9001');
  });
});
