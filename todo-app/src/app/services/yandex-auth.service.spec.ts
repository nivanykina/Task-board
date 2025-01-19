import { TestBed } from '@angular/core/testing';

import { YandexAuthService } from './yandex-auth.service';

describe('YandexAuthService', () => {
  let service: YandexAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(YandexAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
