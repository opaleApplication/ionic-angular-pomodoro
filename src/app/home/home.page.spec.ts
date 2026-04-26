import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NativeAudio } from '@capgo/native-audio';

import { I18nService } from '../core/i18n.service';
import { HomePage } from './home.page';
import { i18nTestingStub } from '../../testing/i18n-test.stub';

describe('HomePage', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;

  beforeEach(async () => {
    spyOn(NativeAudio, 'preload').and.returnValue(Promise.resolve());
    spyOn(NativeAudio, 'play').and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [{ provide: I18nService, useValue: i18nTestingStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render an Ionic page shell', () => {
    expect(fixture.nativeElement.querySelector('ion-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ion-toolbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ion-title')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ion-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ion-grid')).not.toBeNull();
  });

  it('should render translated pomodoro content', () => {
    const content = fixture.nativeElement.textContent;

    expect(content).toContain('Pomodoro Timer');
    expect(content).toContain('Focus');
    expect(content).toContain('Relax');
    expect(content).toContain('Custom');
  });
});
