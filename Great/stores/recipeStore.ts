import { defineStore } from 'pinia'

export const useRecipeStore = defineStore('recipe', {
  state: () => ({
    temperature: null as 'hot' | 'cold' | null,
    iceLevel: null as 'none' | 'less' | 'normal' | 'extra' | null,
    selectedIngredients: [] as {
      ingredientId: number
      quantity: number
      amountValue: number
      amountUnit: string
      stackOrder: number
      selectionType: 'liquid' | 'click' | 'foam'
    }[],
    totalHeightPx: 0,
    currentStep: 1
  }),
  actions: {
    setTemperature(temp: 'hot' | 'cold') {
      this.temperature = temp
      if (temp === 'hot') this.iceLevel = null
    },
    setIceLevel(level: 'none' | 'less' | 'normal' | 'extra') {
      this.iceLevel = level
    },
    addIngredient(ingredient: typeof this.selectedIngredients[0]) {
      this.selectedIngredients.push(ingredient)
    },
    removeIngredient(ingredientId: number) {
      this.selectedIngredients = this.selectedIngredients.filter(i => i.ingredientId !== ingredientId)
    },
    reset() {
      this.temperature = null
      this.iceLevel = null
      this.selectedIngredients = []
      this.totalHeightPx = 0
      this.currentStep = 1
    }
  }
})

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isLoggedIn: false
  }),
  actions: {
    setLoggedIn(val: boolean) {
      this.isLoggedIn = val
    }
  }
})