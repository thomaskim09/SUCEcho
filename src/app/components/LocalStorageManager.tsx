"use client";
import { useState, useEffect } from 'react';
import { Icon } from './Icon';

export default function LocalStorageManager() {
    const [keys, setKeys] = useState<string[]>([]);
    const [selectedKey, setSelectedKey] = useState<string>('');
    const [value, setValue] = useState<string>('');
    const [editValue, setEditValue] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const localKeys = Object.keys(window.localStorage);
            setKeys(localKeys);
            if (localKeys.length > 0 && !selectedKey) {
                setSelectedKey(localKeys[0]);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedKey && typeof window !== 'undefined') {
            const v = window.localStorage.getItem(selectedKey) ?? '';
            setValue(v);
            setEditValue(v);
            setIsEditing(false);
        }
    }, [selectedKey]);

    const handleKeyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedKey(e.target.value);
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = () => {
        if (typeof window !== 'undefined' && selectedKey) {
            window.localStorage.setItem(selectedKey, editValue);
            setValue(editValue);
            setIsEditing(false);
        }
    };

    const handleDelete = () => {
        if (typeof window !== 'undefined' && selectedKey) {
            if (confirm(`确定要删除本地存储键 "${selectedKey}" 吗？`)) {
                window.localStorage.removeItem(selectedKey);
                const newKeys = Object.keys(window.localStorage);
                setKeys(newKeys);
                setSelectedKey(newKeys[0] || '');
                setValue('');
                setEditValue('');
                setIsEditing(false);
            }
        }
    };

    return (
        <div>
            {keys.length === 0 ? (
                <p className="text-gray-400">本地存储为空。</p>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-300 mb-2">选择键</label>
                        <select
                            value={selectedKey}
                            onChange={handleKeyChange}
                            className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                        >
                            {keys.map((key) => (
                                <option key={key} value={key}>{key}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-300 mb-2">值</label>
                        {isEditing ? (
                            <textarea
                                className="w-full bg-gray-800 border border-teal-400 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                                rows={3}
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                            />
                        ) : (
                            <textarea
                                className="w-full bg-gray-800 border border-gray-600 rounded-lg p-2 focus:outline-none focus:border-teal-400"
                                rows={3}
                                value={value}
                                readOnly
                            />
                        )}
                    </div>
                    <div className="flex gap-2">
                        {isEditing ? (
                            <button
                                className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                                onClick={handleSave}
                            >保存</button>
                        ) : (
                            <button
                                className="bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition-colors"
                                onClick={handleEdit}
                                disabled={!selectedKey}
                            >编辑</button>
                        )}
                        <button
                            className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            onClick={handleDelete}
                            disabled={!selectedKey}
                        >
                            <Icon name="trash" className="text-white" /> 删除
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
} 