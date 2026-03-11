import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import {
  Environment,
  EnvVariable,
  createEnvVariable,
  generateId,
} from "../../types";
import { vscode } from "../../vscode";
import "./EnvManager.css";

interface EnvManagerProps {
  environments: Environment[];
  activeEnvId: string | null;
  onSave: (environments: Environment[], activeEnvId: string | null) => void;
  onClose: () => void;
}

interface EnvFile {
  path: string;
  name: string;
}

export function EnvManager({
  environments,
  activeEnvId,
  onSave,
  onClose,
}: EnvManagerProps) {
  const [envs, setEnvs] = useState<Environment[]>(environments);
  const [activeId, setActiveId] = useState<string | null>(activeEnvId);
  const [selectedId, setSelectedId] = useState<string | null>(
    environments[0]?.id ?? null,
  );
  const [envFiles, setEnvFiles] = useState<EnvFile[] | null>(null);
  const [scanning, setScanning] = useState(false);

  const envsRef = useRef(envs);
  const activeIdRef = useRef(activeId);
  useEffect(() => {
    envsRef.current = envs;
  }, [envs]);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const save = useCallback(
    (nextEnvs: Environment[], nextActiveId: string | null) => {
      setEnvs(nextEnvs);
      setActiveId(nextActiveId);
      onSave(nextEnvs, nextActiveId);
    },
    [onSave],
  );

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const msg = e.data as { type: string; payload: unknown };
      if (msg.type === "ENV_FILES_FOUND") {
        setEnvFiles(msg.payload as EnvFile[]);
        setScanning(false);
      }
      if (msg.type === "ENV_FILE_CONTENT") {
        const { variables, fileName } = msg.payload as {
          variables: Array<{ key: string; value: string }>;
          fileName: string;
        };
        const newEnv: Environment = {
          id: generateId(),
          name: fileName,
          variables: [
            ...variables.map((v) => ({
              id: generateId(),
              key: v.key,
              value: v.value,
            })),
            createEnvVariable(),
          ],
        };
        const updated = [...envsRef.current, newEnv];
        setSelectedId(newEnv.id);
        setEnvFiles(null);
        save(updated, activeIdRef.current);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [save]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const selectedEnv = envs.find((e) => e.id === selectedId) ?? null;

  const addEnv = () => {
    const newEnv: Environment = {
      id: generateId(),
      name: "New Environment",
      variables: [createEnvVariable()],
    };
    const updated = [...envs, newEnv];
    setSelectedId(newEnv.id);
    save(updated, activeId);
  };

  const deleteEnv = (id: string) => {
    const updated = envs.filter((e) => e.id !== id);
    if (selectedId === id) setSelectedId(updated[0]?.id ?? null);
    save(updated, activeId === id ? null : activeId);
  };

  const renameEnv = (id: string, name: string) => {
    save(
      envs.map((e) => (e.id === id ? { ...e, name } : e)),
      activeId,
    );
  };

  const setActive = (id: string | null) => {
    setActiveId(id);
    onSave(envs, id);
  };

  const updateVar = (
    envId: string,
    varId: string,
    field: keyof Pick<EnvVariable, "key" | "value">,
    val: string,
  ) => {
    const updated = envs.map((e) => {
      if (e.id !== envId) return e;
      const vars = e.variables.map((v) =>
        v.id === varId ? { ...v, [field]: val } : v,
      );
      const last = vars[vars.length - 1];
      if (last.key || last.value) vars.push(createEnvVariable());
      return { ...e, variables: vars };
    });
    save(updated, activeId);
  };

  const deleteVar = (envId: string, varId: string) => {
    const updated = envs.map((e) => {
      if (e.id !== envId) return e;
      const vars = e.variables.filter((v) => v.id !== varId);
      if (vars.length === 0) vars.push(createEnvVariable());
      return { ...e, variables: vars };
    });
    save(updated, activeId);
  };

  const scanEnvFiles = () => {
    setScanning(true);
    setEnvFiles([]);
    vscode.postMessage({ type: "SCAN_ENV_FILES" });
  };

  const readEnvFile = (path: string, name: string) => {
    vscode.postMessage({
      type: "READ_ENV_FILE",
      payload: { path, fileName: name },
    });
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="env-backdrop" onClick={handleBackdropClick}>
      <div className="env-modal">
        <div className="env-modal-header">
          <span className="env-modal-title">Environments</span>
          <button className="icon-btn" onClick={onClose} title="Close">
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="env-modal-body">
          {/* Left: env list */}
          <div className="env-list-panel">
            <button
              className="btn btn-ghost btn-sm env-action-btn"
              onClick={addEnv}
            >
              <Plus size={12} strokeWidth={2.5} /> New
            </button>
            <button
              className="btn btn-ghost btn-sm env-action-btn"
              onClick={scanEnvFiles}
            >
              <Upload size={12} strokeWidth={2} /> Import .env
            </button>

            {scanning && (
              <div className="env-scanning">Scanning workspace…</div>
            )}

            {envFiles !== null && !scanning && (
              <div className="env-file-picker">
                <div className="env-file-picker-title">Found files</div>
                {envFiles.length === 0 ? (
                  <div className="env-no-files">No .env files found</div>
                ) : (
                  envFiles.map((f) => (
                    <button
                      key={f.path}
                      className="env-file-item"
                      onClick={() => readEnvFile(f.path, f.name)}
                    >
                      {f.name}
                    </button>
                  ))
                )}
              </div>
            )}

            <div className="env-divider" />

            <div className="env-list">
              {envs.map((env) => (
                <button
                  key={env.id}
                  className={`env-list-item${selectedId === env.id ? " env-selected" : ""}`}
                  onClick={() => setSelectedId(env.id)}
                  onDoubleClick={() =>
                    setActive(activeId === env.id ? null : env.id)
                  }
                  title="Double-click to toggle active"
                >
                  <span
                    className={`env-status-dot${activeId === env.id ? " active" : ""}`}
                  />
                  <span className="env-list-name">{env.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right: variable editor */}
          <div className="env-vars-panel">
            {selectedEnv === null ? (
              <div className="env-no-selection">
                <p>Create or select an environment to manage variables.</p>
                <p>
                  Use <code>{"{{VARIABLE_NAME}}"}</code> in URLs, headers, and
                  body — they will be replaced automatically when sending.
                </p>
              </div>
            ) : (
              <>
                <div className="env-vars-header">
                  <input
                    className="env-name-input"
                    value={selectedEnv.name}
                    onChange={(e) => renameEnv(selectedEnv.id, e.target.value)}
                    placeholder="Environment name"
                  />
                  <button
                    className={`btn btn-sm ${activeId === selectedEnv.id ? "btn-primary" : "btn-ghost"}`}
                    onClick={() =>
                      setActive(
                        activeId === selectedEnv.id ? null : selectedEnv.id,
                      )
                    }
                  >
                    {activeId === selectedEnv.id ? "● Active" : "Set Active"}
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => deleteEnv(selectedEnv.id)}
                    title="Delete environment"
                  >
                    <Trash2 size={13} strokeWidth={2} />
                  </button>
                </div>

                <div className="env-vars-table">
                  <div className="env-vars-table-header">
                    <span className="env-var-key">Variable</span>
                    <span className="env-var-value">Value</span>
                  </div>
                  {selectedEnv.variables.map((v) => (
                    <div key={v.id} className="env-var-row">
                      <input
                        className="env-var-key"
                        type="text"
                        placeholder="VARIABLE_NAME"
                        value={v.key}
                        onChange={(e) =>
                          updateVar(selectedEnv.id, v.id, "key", e.target.value)
                        }
                      />
                      <input
                        className="env-var-value"
                        type="text"
                        placeholder="value"
                        value={v.value}
                        onChange={(e) =>
                          updateVar(
                            selectedEnv.id,
                            v.id,
                            "value",
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="kv-del icon-btn"
                        onClick={() => deleteVar(selectedEnv.id, v.id)}
                        title="Remove"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
