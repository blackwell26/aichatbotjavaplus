import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api.model';
import { User } from '../../../core/models/user.model';
import { ApiGatewayService } from '../../../core/services/api-gateway.service';

export interface Address {
  id: string;
  label: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface ProfileUpdateRequest {
  name?: string;
  phone?: string;
  communicationPreferences?: CommunicationPreferences;
}

export interface CommunicationPreferences {
  emailMarketing: boolean;
  orderUpdates: boolean;
  supportNotifications: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(ApiGatewayService);

  private url(...segments: (string | number)[]): string {
    return this.gateway.url('profile', ...segments);
  }

  getProfile(): Observable<
    ApiResponse<User & { phone?: string; communicationPreferences?: CommunicationPreferences }>
  > {
    return this.http.get<
      ApiResponse<User & { phone?: string; communicationPreferences?: CommunicationPreferences }>
    >(this.url());
  }

  updateProfile(payload: ProfileUpdateRequest): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(this.url(), payload);
  }

  changePassword(
    payload: ChangePasswordRequest
  ): Observable<ApiResponse<{ message: string }>> {
    return this.http.post<ApiResponse<{ message: string }>>(
      this.url('change-password'),
      payload
    );
  }

  getAddresses(): Observable<ApiResponse<Address[]>> {
    return this.http.get<ApiResponse<Address[]>>(this.url('addresses'));
  }

  addAddress(address: Omit<Address, 'id'>): Observable<ApiResponse<Address>> {
    return this.http.post<ApiResponse<Address>>(this.url('addresses'), address);
  }

  updateAddress(id: string, address: Partial<Address>): Observable<ApiResponse<Address>> {
    return this.http.patch<ApiResponse<Address>>(this.url('addresses', id), address);
  }

  deleteAddress(id: string): Observable<void> {
    return this.http.delete<void>(this.url('addresses', id));
  }
}
