"use client";

import styles from "../styles";
import type { CabinetProfile, Feature, SuggestionDraft, SuggestionRecord } from "../types";

type CabinetDashboardProps = {
  features: Feature[];
  profile: CabinetProfile;
  suggestion: SuggestionDraft;
  history: SuggestionRecord[];
  roleOptions: string[];
  areaOptions: string[];
  onProfileFieldChange: (field: keyof CabinetProfile, value: string) => void;
  onSuggestionFieldChange: (field: keyof SuggestionDraft, value: string) => void;
  onSubmitSuggestion: () => void;
};

export function CabinetDashboard({
  features,
  profile,
  suggestion,
  history,
  roleOptions,
  areaOptions,
  onProfileFieldChange,
  onSuggestionFieldChange,
  onSubmitSuggestion,
}: CabinetDashboardProps) {
  return (
    <section className={styles.cabinet}>
      <div className={styles.cabinetShell}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionHeaderPanel}>
            <span className={styles.sectionTag}>Cabinet dashboard</span>
            <h2 className={styles.sectionTitle}>
              Personal workspace dashboard,
              <span className={styles.sectionMuted}> feedback desk included.</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Тут окрема сторінка кабінету: профіль користувача, персональні налаштування
              та форма пропозицій для покращення розширення.
            </p>
          </div>
        </div>

        <div className={styles.cabinetGrid}>
          <div className={styles.cabinetCard}>
            <div className={styles.cabinetCardHead}>
              <span className={styles.cabinetEyebrow}>Profile</span>
              <strong>{profile.name || "Authorized user"}</strong>
            </div>

            <div className={styles.profileFormSurface}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Name</span>
                  <input
                    className={styles.fieldInput}
                    value={profile.name}
                    onChange={(event) => onProfileFieldChange("name", event.target.value)}
                    placeholder="Oleksandr"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Role</span>
                  <select
                    className={styles.fieldInput}
                    value={profile.role}
                    onChange={(event) => onProfileFieldChange("role", event.target.value)}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Usage frequency</span>
                  <select
                    className={styles.fieldInput}
                    value={profile.usage}
                    onChange={(event) => onProfileFieldChange("usage", event.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Several times a week">Several times a week</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Sometimes">Sometimes</option>
                  </select>
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Favorite feature</span>
                  <select
                    className={styles.fieldInput}
                    value={profile.favoriteFeature}
                    onChange={(event) =>
                      onProfileFieldChange("favoriteFeature", event.target.value)
                    }
                  >
                    {features.map((feature) => (
                      <option key={feature.title} value={feature.title}>
                        {feature.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.cabinetCard}>
            <div className={styles.cabinetCardHead}>
              <span className={styles.cabinetEyebrow}>Suggestions</span>
              <strong>How should AutoChecker improve?</strong>
            </div>

            <div className={styles.profileFormSurface}>
              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Idea title</span>
                  <input
                    className={styles.fieldInput}
                    value={suggestion.title}
                    onChange={(event) =>
                      onSuggestionFieldChange("title", event.target.value)
                    }
                    placeholder="Add request collections for HTTP Client"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.fieldLabel}>Area</span>
                  <select
                    className={styles.fieldInput}
                    value={suggestion.area}
                    onChange={(event) => onSuggestionFieldChange("area", event.target.value)}
                  >
                    {areaOptions.map((area) => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.fieldWide}>
                  <span className={styles.fieldLabel}>What should change?</span>
                  <textarea
                    className={styles.fieldTextarea}
                    value={suggestion.summary}
                    onChange={(event) =>
                      onSuggestionFieldChange("summary", event.target.value)
                    }
                    placeholder="Describe the feature or workflow improvement you want to see."
                  />
                </label>

                <label className={styles.fieldWide}>
                  <span className={styles.fieldLabel}>Why does it matter?</span>
                  <textarea
                    className={styles.fieldTextarea}
                    value={suggestion.impact}
                    onChange={(event) =>
                      onSuggestionFieldChange("impact", event.target.value)
                    }
                    placeholder="Explain the problem it solves or the time it saves."
                  />
                </label>
              </div>
            </div>

            <button type="button" className={styles.btnPrimary} onClick={onSubmitSuggestion}>
              Send suggestion
            </button>
          </div>
        </div>

        <div className={styles.historyCard}>
          <div className={styles.cabinetCardHead}>
            <span className={styles.cabinetEyebrow}>Recent ideas</span>
            <strong>{history.length ? "Saved local history" : "No suggestions yet"}</strong>
          </div>

          <div className={styles.historyList}>
            {history.length ? (
              history.map((item) => (
                <div key={`${item.createdAt}-${item.title}`} className={styles.historyItem}>
                  <div className={styles.historyMeta}>
                    <span className={styles.cardBadge}>{item.area}</span>
                    <div className={styles.historyMetaInline}>
                      <span className={styles.statusBadge}>{item.status}</span>
                      <span className={styles.historyDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <strong className={styles.historyTitle}>{item.title}</strong>
                  <p className={styles.historyText}>{item.summary}</p>
                  {item.adminNote ? (
                    <p className={styles.historyAdminNote}>Admin note: {item.adminNote}</p>
                  ) : null}
                </div>
              ))
            ) : (
              <p className={styles.historyEmpty}>
                Тут з’являться твої останні пропозиції після відправки.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
