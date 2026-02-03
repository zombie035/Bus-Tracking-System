import React, { useState, useEffect, useRef, useCallback } from 'react';
import { validateField, validateRow } from '../../utils/validators';

const ExcelTable = ({
  data,
  columns,
  onDataChange,
  onAddRow,
  onDeleteRow,
  onDuplicateRow,
  onMoveRow,
  validators = {},
  readOnly = false,
  className = ''
}) => {
  const [editingCell, setEditingCell] = useState(null);
  const [cellValues, setCellValues] = useState({});
  const [errors, setErrors] = useState({});
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const tableRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-save functionality
  useEffect(() => {
    const saveData = () => {
      const saveData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem('excelTableData', JSON.stringify(saveData));
    };

    const interval = setInterval(saveData, 30000); // Save every 30 seconds
    return () => clearInterval(interval);
  }, [data]);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem('excelTableData');
    if (saved) {
      try {
        const { data: savedData, timestamp } = JSON.parse(saved);
        // Only load if saved within last hour
        if (Date.now() - timestamp < 3600000 && onDataChange) {
          onDataChange(savedData);
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (readOnly) return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'z':
            e.preventDefault();
            // Could implement undo/redo here
            break;
        }
      }

      // Row operations
      if (e.ctrlKey && e.shiftKey) {
        switch (e.key) {
          case 'ArrowUp':
            e.preventDefault();
            handleMoveRowsUp();
            break;
          case 'ArrowDown':
            e.preventDefault();
            handleMoveRowsDown();
            break;
        }
      }

      // Navigation
      if (editingCell && !e.ctrlKey && !e.metaKey) {
        const { rowIndex, colIndex } = editingCell;
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleCellEdit(rowIndex, colIndex, cellValues[`${rowIndex}-${colIndex}`] || '');
            if (e.shiftKey) {
              navigateCell(rowIndex - 1, colIndex);
            } else {
              navigateCell(rowIndex + 1, colIndex);
            }
            break;
          case 'Tab':
            e.preventDefault();
            if (e.shiftKey) {
              navigateCell(rowIndex, colIndex - 1);
            } else {
              navigateCell(rowIndex, colIndex + 1);
            }
            break;
          case 'Escape':
            e.preventDefault();
            setEditingCell(null);
            setCellValues(prev => {
              const newValues = { ...prev };
              delete newValues[`${rowIndex}-${colIndex}`];
              return newValues;
            });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editingCell, cellValues, selectedRows, data]);

  const navigateCell = (rowIndex, colIndex) => {
    if (rowIndex < 0) rowIndex = data.length - 1;
    if (rowIndex >= data.length) rowIndex = 0;
    if (colIndex < 0) colIndex = columns.length - 1;
    if (colIndex >= columns.length) colIndex = 0;

    startEditing(rowIndex, colIndex);
  };

  const startEditing = (rowIndex, colIndex) => {
    setEditingCell({ rowIndex, colIndex });
    const cellKey = `${rowIndex}-${colIndex}`;
    const currentValue = data[rowIndex]?.[columns[colIndex].key] || '';
    setCellValues(prev => ({
      ...prev,
      [cellKey]: currentValue
    }));

    // Focus input after render
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 0);
  };

  const handleCellEdit = (rowIndex, colIndex, value) => {
    const column = columns[colIndex];
    const cellKey = `${rowIndex}-${colIndex}`;

    // Validate
    const validationError = validateField(column.key, value, data[rowIndex], data);
    setErrors(prev => ({
      ...prev,
      [cellKey]: validationError
    }));

    // Update data
    const newData = [...data];
    if (!newData[rowIndex]) {
      newData[rowIndex] = {};
    }
    newData[rowIndex][column.key] = value;

    // Validate entire row
    const rowErrors = validateRow(newData[rowIndex], newData);
    setErrors(prev => ({
      ...prev,
      ...Object.keys(rowErrors).reduce((acc, field) => {
        acc[`${rowIndex}-${columns.findIndex(c => c.key === field)}`] = rowErrors[field];
        return acc;
      }, {})
    }));

    onDataChange?.(newData);
    setEditingCell(null);
    setCellValues(prev => {
      const newValues = { ...prev };
      delete newValues[cellKey];
      return newValues;
    });
  };

  const handleRowSelect = (rowIndex, e) => {
    const newSelected = new Set(selectedRows);

    if (e.ctrlKey || e.metaKey) {
      // Multi-select
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex);
      } else {
        newSelected.add(rowIndex);
      }
    } else if (e.shiftKey && lastSelectedIndex !== null) {
      // Range select
      const start = Math.min(lastSelectedIndex, rowIndex);
      const end = Math.max(lastSelectedIndex, rowIndex);
      for (let i = start; i <= end; i++) {
        newSelected.add(i);
      }
    } else {
      // Single select
      newSelected.clear();
      newSelected.add(rowIndex);
    }

    setSelectedRows(newSelected);
    setLastSelectedIndex(rowIndex);
  };

  const handleCopy = () => {
    if (selectedRows.size === 0) return;

    const selectedData = Array.from(selectedRows)
      .sort((a, b) => a - b)
      .map(index => data[index]);

    const csvData = [
      columns.map(col => col.label).join('\t'),
      ...selectedData.map(row =>
        columns.map(col => row[col.key] || '').join('\t')
      )
    ].join('\n');

    navigator.clipboard.writeText(csvData);
  };

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const lines = clipboardText.trim().split('\n');

      if (lines.length === 0) return;

      const pasteData = lines.map(line =>
        line.split('\t').map(cell => cell.trim())
      );

      const newData = [...data];
      let currentRowIndex = Math.min(...Array.from(selectedRows)) || 0;

      pasteData.forEach((rowData, pasteRowIndex) => {
        const targetRowIndex = currentRowIndex + pasteRowIndex;

        if (targetRowIndex >= newData.length) {
          newData.push({});
        }

        columns.forEach((col, colIndex) => {
          if (pasteData[0] && pasteData[0][colIndex]) {
            newData[targetRowIndex][col.key] = pasteData[pasteRowIndex][colIndex];
          }
        });
      });

      onDataChange?.(newData);
    } catch (error) {
      console.error('Paste failed:', error);
    }
  };

  const handleMoveRowsUp = () => {
    if (selectedRows.size === 0 || onMoveRow) return;

    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b);
    const minIndex = Math.min(...sortedIndices);

    if (minIndex > 0) {
      onMoveRow(sortedIndices, -1);
    }
  };

  const handleMoveRowsDown = () => {
    if (selectedRows.size === 0 || onMoveRow) return;

    const sortedIndices = Array.from(selectedRows).sort((a, b) => a - b);
    const maxIndex = Math.max(...sortedIndices);

    if (maxIndex < data.length - 1) {
      onMoveRow(sortedIndices, 1);
    }
  };

  const renderCell = (row, rowIndex, column, colIndex) => {
    const cellKey = `${rowIndex}-${colIndex}`;
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.colIndex === colIndex;
    const hasError = errors[cellKey];
    const isSelected = selectedRows.has(rowIndex);

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="text"
          value={cellValues[cellKey] || ''}
          onChange={(e) => setCellValues(prev => ({ ...prev, [cellKey]: e.target.value }))}
          onBlur={() => handleCellEdit(rowIndex, colIndex, cellValues[cellKey] || '')}
          className={`w-full px-2 py-1 border-0 outline-none bg-blue-50 ${hasError ? 'ring-2 ring-red-500' : ''}`}
        />
      );
    }

    return (
      <div
        className={`px-2 py-1 cursor-pointer hover:bg-gray-100 min-h-[24px] ${
          isSelected ? 'bg-blue-100' : ''
        } ${hasError ? 'bg-red-50 border border-red-300' : ''}`}
        onClick={() => !readOnly && startEditing(rowIndex, colIndex)}
        title={hasError || row[column.key] || ''}
      >
        {column.render ? column.render(row[column.key], row) : row[column.key] || ''}
        {hasError && (
          <div className="text-red-500 text-xs mt-1">{hasError}</div>
        )}
      </div>
    );
  };

  return (
    <div className={`excel-table ${className}`}>
      {/* Keyboard shortcuts help */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <strong>Keyboard Shortcuts:</strong>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <div>Ctrl+C: Copy selected rows</div>
          <div>Ctrl+V: Paste data</div>
          <div>Ctrl+Shift+↑/↓: Move rows</div>
          <div>Tab/Enter: Navigate cells</div>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table ref={tableRef} className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                #
              </th>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-gray-50 ${selectedRows.has(rowIndex) ? 'bg-blue-50' : ''}`}
                onClick={(e) => handleRowSelect(rowIndex, e)}
              >
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 w-12">
                  {rowIndex + 1}
                </td>
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key}
                    className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                  >
                    {renderCell(row, rowIndex, column, colIndex)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action buttons */}
      {!readOnly && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => onAddRow?.()}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Add Row
          </button>
          <button
            onClick={() => {
              selectedRows.forEach(index => onDeleteRow?.(index));
              setSelectedRows(new Set());
            }}
            disabled={selectedRows.size === 0}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
          >
            Delete Selected ({selectedRows.size})
          </button>
          <button
            onClick={() => {
              selectedRows.forEach(index => onDuplicateRow?.(index));
              setSelectedRows(new Set());
            }}
            disabled={selectedRows.size === 0}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            Duplicate Selected
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelTable;
