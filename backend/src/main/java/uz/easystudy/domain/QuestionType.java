package uz.easystudy.domain;

public enum QuestionType {
    SINGLE_CHOICE, MULTI_CHOICE, GAP_FILL, TRUE_FALSE_NG, MATCHING,
    /** Yozma javob (Writing): o'qituvchi tekshiradi */
    ESSAY,
    /** Ovozli javob (Speaking): talaba brauzerda yozib yuboradi, o'qituvchi tekshiradi */
    SPEAKING;

    public boolean isManual() {
        return this == ESSAY || this == SPEAKING;
    }
}
