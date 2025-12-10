import { TestBed } from '@angular/core/testing';
import { ProjectContextService } from './project-context.service';
import { Project } from '../models/project.model';

describe('ProjectContextService', () => {
  let service: ProjectContextService;

  const mockProjects: Project[] = [
    {
      id: 1,
      name: 'Project Alpha',
      description: 'First test project',
      key: 'ALPHA',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: 'Project Beta',
      description: 'Second test project',
      key: 'BETA',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectContextService]
    });
    service = TestBed.inject(ProjectContextService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set projects and emit changes', (done) => {
    service.projects$.subscribe(projects => {
      if (projects.length > 0) {
        expect(projects).toEqual(mockProjects);
        expect(projects.length).toBe(2);
        done();
      }
    });

    service.setProjects(mockProjects);
  });

  it('should auto-select first project when none selected', (done) => {
    service.selectedProject$.subscribe(project => {
      if (project) {
        expect(project).toEqual(mockProjects[0]);
        done();
      }
    });

    service.setProjects(mockProjects);
  });

  it('should select project and save to localStorage', (done) => {
    const projectToSelect = mockProjects[1];

    service.selectedProject$.subscribe(project => {
      if (project) {
        expect(project).toEqual(projectToSelect);
        const saved = localStorage.getItem('selected_project');
        expect(saved).toBeTruthy();
        if (saved) {
          expect(JSON.parse(saved)).toEqual(projectToSelect);
        }
        done();
      }
    });

    service.selectProject(projectToSelect);
  });

  it('should restore selected project from localStorage on init', () => {
    localStorage.setItem('selected_project', JSON.stringify(mockProjects[0]));

    // Create new service instance to trigger constructor
    const newService = new ProjectContextService();

    expect(newService.selectedProject).toEqual(mockProjects[0]);
  });

  it('should clear project selection', () => {
    service.selectProject(mockProjects[0]);
    expect(service.selectedProject).toBeTruthy();

    service.selectProject(null);

    expect(service.selectedProject).toBeNull();
    expect(localStorage.getItem('selected_project')).toBeNull();
  });

  it('should get current selected project value', () => {
    service.selectProject(mockProjects[0]);
    expect(service.selectedProject).toEqual(mockProjects[0]);
  });

  it('should get current projects array', () => {
    service.setProjects(mockProjects);
    expect(service.projects).toEqual(mockProjects);
  });

  it('should clear entire context', () => {
    service.setProjects(mockProjects);
    service.selectProject(mockProjects[0]);

    service.clearContext();

    expect(service.selectedProject).toBeNull();
    expect(service.projects).toEqual([]);
    expect(localStorage.getItem('selected_project')).toBeNull();
  });

  it('should maintain selected project if it still exists in new project list', (done) => {
    service.setProjects(mockProjects);
    service.selectProject(mockProjects[0]);

    // Wait for initial selection
    setTimeout(() => {
      // Set projects again with same project
      service.setProjects(mockProjects);

      service.selectedProject$.subscribe(project => {
        if (project) {
          expect(project.id).toBe(mockProjects[0].id);
          done();
        }
      });
    }, 100);
  });

  it('should handle empty project list', () => {
    service.setProjects([]);
    expect(service.projects).toEqual([]);
    expect(service.selectedProject).toBeNull();
  });
});
