import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import { createEnvVariable, generateId, } from "../../types";
import { vscode } from "../../vscode";
import "./EnvManager.css";
export function EnvManager({ environments, activeEnvId, onSave, onClose, }) {
    const [envs, setEnvs] = useState(environments);
    const [activeId, setActiveId] = useState(activeEnvId);
    const [selectedId, setSelectedId] = useState(environments[0]?.id ?? null);
    const [envFiles, setEnvFiles] = useState(null);
    const [scanning, setScanning] = useState(false);
    const envsRef = useRef(envs);
    const activeIdRef = useRef(activeId);
    useEffect(() => {
        envsRef.current = envs;
    }, [envs]);
    useEffect(() => {
        activeIdRef.current = activeId;
    }, [activeId]);
    const save = useCallback((nextEnvs, nextActiveId) => {
        setEnvs(nextEnvs);
        setActiveId(nextActiveId);
        onSave(nextEnvs, nextActiveId);
    }, [onSave]);
    useEffect(() => {
        const handler = (e) => {
            const msg = e.data;
            if (msg.type === "ENV_FILES_FOUND") {
                setEnvFiles(msg.payload);
                setScanning(false);
            }
            if (msg.type === "ENV_FILE_CONTENT") {
                const { variables, fileName } = msg.payload;
                const newEnv = {
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
        const handler = (e) => {
            if (e.key === "Escape")
                onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);
    const selectedEnv = envs.find((e) => e.id === selectedId) ?? null;
    const addEnv = () => {
        const newEnv = {
            id: generateId(),
            name: "New Environment",
            variables: [createEnvVariable()],
        };
        const updated = [...envs, newEnv];
        setSelectedId(newEnv.id);
        save(updated, activeId);
    };
    const deleteEnv = (id) => {
        const updated = envs.filter((e) => e.id !== id);
        if (selectedId === id)
            setSelectedId(updated[0]?.id ?? null);
        save(updated, activeId === id ? null : activeId);
    };
    const renameEnv = (id, name) => {
        save(envs.map((e) => (e.id === id ? { ...e, name } : e)), activeId);
    };
    const setActive = (id) => {
        setActiveId(id);
        onSave(envs, id);
    };
    const updateVar = (envId, varId, field, val) => {
        const updated = envs.map((e) => {
            if (e.id !== envId)
                return e;
            const vars = e.variables.map((v) => v.id === varId ? { ...v, [field]: val } : v);
            const last = vars[vars.length - 1];
            if (last.key || last.value)
                vars.push(createEnvVariable());
            return { ...e, variables: vars };
        });
        save(updated, activeId);
    };
    const deleteVar = (envId, varId) => {
        const updated = envs.map((e) => {
            if (e.id !== envId)
                return e;
            const vars = e.variables.filter((v) => v.id !== varId);
            if (vars.length === 0)
                vars.push(createEnvVariable());
            return { ...e, variables: vars };
        });
        save(updated, activeId);
    };
    const scanEnvFiles = () => {
        setScanning(true);
        setEnvFiles([]);
        vscode.postMessage({ type: "SCAN_ENV_FILES" });
    };
    const readEnvFile = (path, name) => {
        vscode.postMessage({
            type: "READ_ENV_FILE",
            payload: { path, fileName: name },
        });
    };
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget)
            onClose();
    };
    return (_jsx("div", { className: "env-backdrop", onClick: handleBackdropClick, children: _jsxs("div", { className: "env-modal", children: [_jsxs("div", { className: "env-modal-header", children: [_jsx("span", { className: "env-modal-title", children: "Environments" }), _jsx("button", { className: "icon-btn", onClick: onClose, title: "Close", children: _jsx(X, { size: 14, strokeWidth: 2 }) })] }), _jsxs("div", { className: "env-modal-body", children: [_jsxs("div", { className: "env-list-panel", children: [_jsxs("button", { className: "btn btn-ghost btn-sm env-action-btn", onClick: addEnv, children: [_jsx(Plus, { size: 12, strokeWidth: 2.5 }), " New"] }), _jsxs("button", { className: "btn btn-ghost btn-sm env-action-btn", onClick: scanEnvFiles, children: [_jsx(Upload, { size: 12, strokeWidth: 2 }), " Import .env"] }), scanning && (_jsx("div", { className: "env-scanning", children: "Scanning workspace\u2026" })), envFiles !== null && !scanning && (_jsxs("div", { className: "env-file-picker", children: [_jsx("div", { className: "env-file-picker-title", children: "Found files" }), envFiles.length === 0 ? (_jsx("div", { className: "env-no-files", children: "No .env files found" })) : (envFiles.map((f) => (_jsx("button", { className: "env-file-item", onClick: () => readEnvFile(f.path, f.name), children: f.name }, f.path))))] })), _jsx("div", { className: "env-divider" }), _jsx("div", { className: "env-list", children: envs.map((env) => (_jsxs("button", { className: `env-list-item${selectedId === env.id ? " env-selected" : ""}`, onClick: () => setSelectedId(env.id), onDoubleClick: () => setActive(activeId === env.id ? null : env.id), title: "Double-click to toggle active", children: [_jsx("span", { className: `env-status-dot${activeId === env.id ? " active" : ""}` }), _jsx("span", { className: "env-list-name", children: env.name })] }, env.id))) })] }), _jsx("div", { className: "env-vars-panel", children: selectedEnv === null ? (_jsxs("div", { className: "env-no-selection", children: [_jsx("p", { children: "Create or select an environment to manage variables." }), _jsxs("p", { children: ["Use ", _jsx("code", { children: "{{VARIABLE_NAME}}" }), " in URLs, headers, and body \u2014 they will be replaced automatically when sending."] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "env-vars-header", children: [_jsx("input", { className: "env-name-input", value: selectedEnv.name, onChange: (e) => renameEnv(selectedEnv.id, e.target.value), placeholder: "Environment name" }), _jsx("button", { className: `btn btn-sm ${activeId === selectedEnv.id ? "btn-primary" : "btn-ghost"}`, onClick: () => setActive(activeId === selectedEnv.id ? null : selectedEnv.id), children: activeId === selectedEnv.id ? "● Active" : "Set Active" }), _jsx("button", { className: "icon-btn", onClick: () => deleteEnv(selectedEnv.id), title: "Delete environment", children: _jsx(Trash2, { size: 13, strokeWidth: 2 }) })] }), _jsxs("div", { className: "env-vars-table", children: [_jsxs("div", { className: "env-vars-table-header", children: [_jsx("span", { className: "env-var-key", children: "Variable" }), _jsx("span", { className: "env-var-value", children: "Value" })] }), selectedEnv.variables.map((v) => (_jsxs("div", { className: "env-var-row", children: [_jsx("input", { className: "env-var-key", type: "text", placeholder: "VARIABLE_NAME", value: v.key, onChange: (e) => updateVar(selectedEnv.id, v.id, "key", e.target.value) }), _jsx("input", { className: "env-var-value", type: "text", placeholder: "value", value: v.value, onChange: (e) => updateVar(selectedEnv.id, v.id, "value", e.target.value) }), _jsx("button", { className: "kv-del icon-btn", onClick: () => deleteVar(selectedEnv.id, v.id), title: "Remove", children: _jsx(X, { size: 11, strokeWidth: 2.5 }) })] }, v.id)))] })] })) })] })] }) }));
}
