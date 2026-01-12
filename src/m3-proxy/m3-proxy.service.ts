import { Injectable, HttpException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class M3ProxyService {
  private readonly m3BaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.m3BaseUrl = this.configService.get('M3_BACKEND_URL') || 'http://localhost:8000';
  }

  async forwardRequest(
    method: string,
    path: string,
    data?: any,
    headers?: any,
  ): Promise<any> {
    try {
      const url = `${this.m3BaseUrl}${path}`;
      
      const config = {
        method,
        url,
        data,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      };

      const response = await firstValueFrom(
        this.httpService.request<any>(config)
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new HttpException(
          error.response.data,
          error.response.status,
        );
      }
      throw error;
    }
  }
}
