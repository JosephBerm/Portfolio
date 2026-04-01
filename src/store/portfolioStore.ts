'use client'

import { create } from 'zustand'
import { myPortfolio } from '@/lib'
import type { IUserProfile, IWorkExperience, IFeaturedProject, IOtherProject } from '@/lib'

interface PortfolioState {
	userProfile: IUserProfile
	workExperience: IWorkExperience[]
	featuredProjects: IFeaturedProject[]
	otherProjects: IOtherProject[]
	setUserProfile: (profile: IUserProfile) => void
	setWorkExperience: (experience: IWorkExperience[]) => void
	setFeaturedProjects: (projects: IFeaturedProject[]) => void
	setOtherProjects: (projects: IOtherProject[]) => void
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
	userProfile: myPortfolio.userProfile,
	workExperience: myPortfolio.workExperience,
	featuredProjects: myPortfolio.featuredProjects,
	otherProjects: myPortfolio.otherProjects,
	setUserProfile: (profile) => set({ userProfile: profile }),
	setWorkExperience: (experience) => set({ workExperience: experience }),
	setFeaturedProjects: (projects) => set({ featuredProjects: projects }),
	setOtherProjects: (projects) => set({ otherProjects: projects }),
}))
