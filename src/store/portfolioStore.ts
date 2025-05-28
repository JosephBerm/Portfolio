import { create } from 'zustand';
import { 
    IMyPortfolio, 
    IUserProfile, 
    IWorkExperience, 
    IFeaturedProject, 
    IOtherProject 
} from '@/services/portfolioInformation';
import myPortfolio from '@/services/portfolioInformation';

interface PortfolioState {
    // State
    userProfile: IUserProfile;
    workExperience: IWorkExperience[];
    featuredProjects: IFeaturedProject[];
    otherProjects: IOtherProject[];
    
    // Actions
    setUserProfile: (profile: IUserProfile) => void;
    setWorkExperience: (experience: IWorkExperience[]) => void;
    setFeaturedProjects: (projects: IFeaturedProject[]) => void;
    setOtherProjects: (projects: IOtherProject[]) => void;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
    // Initial state
    userProfile: myPortfolio.userProfile,
    workExperience: myPortfolio.workExperience,
    featuredProjects: myPortfolio.featuredProjects,
    otherProjects: myPortfolio.otherProjects,

    // Actions
    setUserProfile: (profile) => set({ userProfile: profile }),
    setWorkExperience: (experience) => set({ workExperience: experience }),
    setFeaturedProjects: (projects) => set({ featuredProjects: projects }),
    setOtherProjects: (projects) => set({ otherProjects: projects }),
})); 