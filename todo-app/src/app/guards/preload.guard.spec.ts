import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { PreloadGuard } from './preload.guard';
import { LoaderService } from '../services/loader.service';

describe('PreloadGuard', () => {
  let loaderService: LoaderService;
  let guard: PreloadGuard;

  const executeGuard: CanActivateFn = () => {
    return TestBed.runInInjectionContext(() => guard.canActivate());
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService],
    });

    loaderService = TestBed.inject(LoaderService);
    guard = new PreloadGuard(loaderService);
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
