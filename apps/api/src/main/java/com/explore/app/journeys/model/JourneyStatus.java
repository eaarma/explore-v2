package com.explore.app.journeys.model;

public enum JourneyStatus {
    ACTIVE(1),
    INACTIVE(0);

    private final int code;

    JourneyStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static JourneyStatus fromCode(Integer code) {

        if (code == null) {
            return ACTIVE;
        }

        for (JourneyStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }

        return ACTIVE;
    }
}
