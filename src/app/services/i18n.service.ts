import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import esTranslations from '../i18n/es.json';

export type Language = 'es';

export interface TranslationKeys {
    common: {
        loading: string;
        error: string;
        success: string;
        cancel: string;
        save: string;
        delete: string;
        edit: string;
        add: string;
        close: string;
        confirm: string;
        yes: string;
        no: string;
        ok: string;
        retry: string;
        refresh: string;
    };
    tasks: {
        title: string;
        description: string;
        priority: string;
        category: string;
        dueDate: string;
        completed: string;
        pending: string;
        overdue: string;
        daysLeft: string;
        createdAt: string;
        updatedAt: string;
        addTask: string;
        editTask: string;
        deleteTask: string;
        markComplete: string;
        markIncomplete: string;
        noTasks: string;
        loadingTasks: string;
        errorLoadingTasks: string;
        taskSaved: string;
        taskDeleted: string;
        taskUpdated: string;
        unsavedChanges: string;
        saveChanges: string;
        discardChanges: string;
        confirmDelete: string;
        confirmDiscard: string;
    };
    priorities: {
        high: string;
        medium: string;
        low: string;
        highDescription: string;
        mediumDescription: string;
        lowDescription: string;
    };
    categories: {
        general: string;
        work: string;
        personal: string;
        study: string;
        health: string;
        shopping: string;
        home: string;
        finance: string;
    };
    sync: {
        title: string;
        connectionStatus: string;
        syncStatus: string;
        online: string;
        offline: string;
        syncing: string;
        synced: string;
        pending: string;
        error: string;
        idle: string;
        readyToSync: string;
        syncNow: string;
        syncInProgress: string;
        syncCompleted: string;
        syncError: string;
        forceSync: string;
        autoSync: string;
        pendingSync: string;
        localTasks: string;
        apiTasks: string;
        updateStats: string;
        syncInfo: string;
        progress: string;
        completed: string;
        total: string;
        local: string;
        api: string;
    };
    database: {
        initializing: string;
        initialized: string;
        errorInitializing: string;
        connectionError: string;
        queryError: string;
        tableCreationError: string;
        notReady: string;
        connectionClosed: string;
    };
    errors: {
        general: string;
        network: string;
        api: string;
        database: string;
        validation: string;
        permission: string;
        timeout: string;
        unknown: string;
        taskNotFound: string;
        invalidOperation: string;
        syncFailed: string;
        offlineOperation: string;
    };
    messages: {
        welcome: string;
        taskAdded: string;
        taskUpdated: string;
        taskDeleted: string;
        syncStarted: string;
        syncCompleted: string;
        syncFailed: string;
        connectionRestored: string;
        connectionLost: string;
        workingOffline: string;
        dataSaved: string;
        pendingSync: string;
    };
    validation: {
        required: string;
        minLength: string;
        maxLength: string;
        invalidFormat: string;
        invalidDate: string;
        futureDate: string;
        titleRequired: string;
        titleMinLength: string;
        descriptionMaxLength: string;
    };
    notifications: {
        title: string;
        newTask: string;
        taskCompleted: string;
        taskOverdue: string;
        syncComplete: string;
        syncError: string;
        connectionRestored: string;
        connectionLost: string;
    };
    settings: {
        title: string;
        language: string;
        theme: string;
        notifications: string;
        sync: string;
        database: string;
        about: string;
        version: string;
        clearData: string;
        exportData: string;
        importData: string;
    };
    help: {
        title: string;
        howToUse: string;
        syncExplanation: string;
        offlineMode: string;
        faq: string;
        contact: string;
        tutorial: string;
    };
}

@Injectable({
    providedIn: 'root'
})
export class I18nService {
    private currentLanguageSubject = new BehaviorSubject<Language>('es');
    private translations: Record<Language, TranslationKeys> = {
        es: esTranslations as TranslationKeys
    };

    constructor() {
        this.initializeLanguage();
    }

    private initializeLanguage(): void {
        // Por ahora solo soportamos español
        this.currentLanguageSubject.next('es');
    }

    // Obtener idioma actual
    getCurrentLanguage(): Observable<Language> {
        return this.currentLanguageSubject.asObservable();
    }

    // Obtener idioma actual como valor
    getCurrentLanguageValue(): Language {
        return this.currentLanguageSubject.value;
    }

    // Cambiar idioma (por ahora solo español)
    setLanguage(language: Language): void {
        if (language === 'es') {
            this.currentLanguageSubject.next(language);
        }
    }

    // Obtener traducción por clave
    translate(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let translation: any = this.translations[this.currentLanguageSubject.value];

        for (const k of keys) {
            if (translation && translation[k]) {
                translation = translation[k];
            } else {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }

        if (typeof translation === 'string' && params) {
            return this.interpolateParams(translation, params);
        }

        return translation || key;
    }

    // Interpolar parámetros en las traducciones
    private interpolateParams(text: string, params: Record<string, string | number>): string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key]?.toString() || match;
        });
    }

    // Obtener traducciones completas
    getTranslations(): TranslationKeys {
        return this.translations[this.currentLanguageSubject.value];
    }

    // Métodos de conveniencia para traducciones comunes
    getCommon(): TranslationKeys['common'] {
        return this.translations[this.currentLanguageSubject.value].common;
    }

    getTasks(): TranslationKeys['tasks'] {
        return this.translations[this.currentLanguageSubject.value].tasks;
    }

    getPriorities(): TranslationKeys['priorities'] {
        return this.translations[this.currentLanguageSubject.value].priorities;
    }

    getCategories(): TranslationKeys['categories'] {
        return this.translations[this.currentLanguageSubject.value].categories;
    }

    getSync(): TranslationKeys['sync'] {
        return this.translations[this.currentLanguageSubject.value].sync;
    }

    getDatabase(): TranslationKeys['database'] {
        return this.translations[this.currentLanguageSubject.value].database;
    }

    getErrors(): TranslationKeys['errors'] {
        return this.translations[this.currentLanguageSubject.value].errors;
    }

    getMessages(): TranslationKeys['messages'] {
        return this.translations[this.currentLanguageSubject.value].messages;
    }

    getValidation(): TranslationKeys['validation'] {
        return this.translations[this.currentLanguageSubject.value].validation;
    }

    getNotifications(): TranslationKeys['notifications'] {
        return this.translations[this.currentLanguageSubject.value].notifications;
    }

    getSettings(): TranslationKeys['settings'] {
        return this.translations[this.currentLanguageSubject.value].settings;
    }

    getHelp(): TranslationKeys['help'] {
        return this.translations[this.currentLanguageSubject.value].help;
    }
}
