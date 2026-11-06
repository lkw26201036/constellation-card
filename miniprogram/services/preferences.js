const quiz = require("../data/quiz")
module.exports = {
  getPreferences() { return { reducedMotion: wx.getStorageSync("reducedMotion") === true } },
  setReducedMotion(value) { wx.setStorageSync("reducedMotion", value === true) },
  getQuizDraft() {
    const draft = wx.getStorageSync("quizDraft")
    if (!draft || draft.version !== "q1" || !Array.isArray(draft.answers) || draft.answers.length === 0 || draft.answers.length > quiz.questions.length) return null
    if (!Number.isInteger(draft.index) || draft.index < 0 || draft.index >= quiz.questions.length || draft.index > draft.answers.length) return null
    if (Array.from(draft.answers).some(value => !Number.isInteger(value) || value < 0 || value > 3)) return null
    return draft
  },
  saveQuizDraft(answers, index) {
    if (!answers.length) return
    if (!Number.isInteger(index) || index < 0 || index >= quiz.questions.length || index > answers.length || answers.length > quiz.questions.length || Array.from(answers).some(value => !Number.isInteger(value) || value < 0 || value > 3)) throw new Error("Invalid quiz draft")
    wx.setStorageSync("quizDraft", { version: "q1", answers: answers.slice(), index, updatedAt: Date.now() })
  },
  clearQuizDraft() { wx.removeStorageSync("quizDraft") }
}
