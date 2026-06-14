package com.explore.app.appconfig.repository;

import com.explore.app.appconfig.model.AppConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppConfigurationRepository extends JpaRepository<AppConfiguration, Short> {

    default Optional<AppConfiguration> findGlobal() {
        return findById(AppConfiguration.GLOBAL_ID);
    }
}
