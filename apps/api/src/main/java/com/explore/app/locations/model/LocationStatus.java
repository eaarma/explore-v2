package com.explore.app.locations.model;

public enum LocationStatus {
    ACTIVE(1),
    INACTIVE(0),
    DISABLED(2);

    private final int code;

    LocationStatus(int code) {
        this.code = code;
    }

    public int getCode() {
        return code;
    }

    public static LocationStatus fromCode(Integer code) {
        if (code == null) {
            return ACTIVE;
        }

        for (LocationStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }

        return ACTIVE;
    }
}
