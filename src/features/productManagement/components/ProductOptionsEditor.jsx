import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  FormControlLabel,
  Switch,
  Radio,
  Paper,
  Divider,
  Stack,
  Tooltip,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const ProductOptionsEditor = ({ options, onChange }) => {
  const handleAddOption = () => {
    const newOption = {
      name: '',
      is_required: true,
      values: [
        { label: 'Standard', price_adjustment: '0.00', is_default: true },
      ],
    };
    onChange([...options, newOption]);
  };

  const handleRemoveOption = (optIndex) => {
    onChange(options.filter((_, i) => i !== optIndex));
  };

  const handleOptionNameChange = (optIndex, value) => {
    const updated = options.map((opt, i) => {
      if (i === optIndex) return { ...opt, name: value };
      return opt;
    });
    onChange(updated);
  };

  const handleOptionRequiredToggle = (optIndex, checked) => {
    const updated = options.map((opt, i) => {
      if (i === optIndex) return { ...opt, is_required: checked };
      return opt;
    });
    onChange(updated);
  };

  const handleAddValue = (optIndex) => {
    const updated = options.map((opt, i) => {
      if (i === optIndex) {
        const isFirst = (!opt.values || opt.values.length === 0);
        return {
          ...opt,
          values: [
            ...(opt.values || []),
            { label: '', price_adjustment: '0.00', is_default: isFirst },
          ],
        };
      }
      return opt;
    });
    onChange(updated);
  };

  const handleRemoveValue = (optIndex, valIndex) => {
    const updated = options.map((opt, i) => {
      if (i === optIndex) {
        const newValues = opt.values.filter((_, vi) => vi !== valIndex);
        // If deleted was default, make first remaining default
        if (newValues.length > 0 && !newValues.some((v) => v.is_default)) {
          newValues[0].is_default = true;
        }
        return { ...opt, values: newValues };
      }
      return opt;
    });
    onChange(updated);
  };

  const handleValueChange = (optIndex, valIndex, field, value) => {
    const updated = options.map((opt, i) => {
      if (i === optIndex) {
        const newValues = opt.values.map((val, vi) => {
          if (vi === valIndex) {
            return { ...val, [field]: value };
          }
          // If setting default, unset default on siblings
          if (field === 'is_default' && value === true) {
            return { ...val, is_default: false };
          }
          return val;
        });
        return { ...opt, values: newValues };
      }
      return opt;
    });
    onChange(updated);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Configurable Product Options
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Allow customers to customize attributes (e.g., Size, Paper Type, Lamination, Corners) with price add-ons.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddOption}
        >
          Add Option
        </Button>
      </Box>

      {options.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderStyle: 'dashed',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No configurable options defined. The product will be sold as a fixed-spec item.
          </Typography>
          <Button size="small" variant="text" onClick={handleAddOption}>
            Add First Option
          </Button>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {options.map((option, optIndex) => (
            <Paper
              key={optIndex}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 1.5,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              {/* Option Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Chip
                  label={`Option #${optIndex + 1}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
                <TextField
                  size="small"
                  label="Option Name"
                  placeholder="e.g. Paper Type or Size"
                  value={option.name}
                  onChange={(e) => handleOptionNameChange(optIndex, e.target.value)}
                  sx={{ flexGrow: 1 }}
                  required
                />
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={option.is_required}
                      onChange={(e) => handleOptionRequiredToggle(optIndex, e.target.checked)}
                    />
                  }
                  label={
                    <Typography variant="caption" fontWeight={600}>
                      {option.is_required ? 'Required' : 'Optional'}
                    </Typography>
                  }
                />
                <Tooltip title="Delete Entire Option">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemoveOption(optIndex)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              <Divider sx={{ my: 1.5 }} />

              {/* Option Values List */}
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
                CHOICE VALUES FOR &quot;{option.name || 'THIS OPTION'}&quot;
              </Typography>

              <Stack spacing={1}>
                {(option.values || []).map((val, valIndex) => (
                  <Box
                    key={valIndex}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      bgcolor: 'grey.50',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Tooltip title="Pre-select as Default">
                      <Radio
                        size="small"
                        checked={Boolean(val.is_default)}
                        onChange={() => handleValueChange(optIndex, valIndex, 'is_default', true)}
                      />
                    </Tooltip>
                    <TextField
                      size="small"
                      placeholder="Value label (e.g. 350 GSM Matte)"
                      value={val.label}
                      onChange={(e) => handleValueChange(optIndex, valIndex, 'label', e.target.value)}
                      sx={{ flexGrow: 1 }}
                      required
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Extra Price (₹)"
                      placeholder="0.00"
                      value={val.price_adjustment}
                      onChange={(e) => handleValueChange(optIndex, valIndex, 'price_adjustment', e.target.value)}
                      sx={{ width: 140 }}
                      inputProps={{ step: 0.01 }}
                    />
                    <Tooltip title="Remove Choice">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handleRemoveValue(optIndex, valIndex)}
                        disabled={option.values.length <= 1}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>

              <Button
                size="small"
                variant="text"
                startIcon={<AddIcon fontSize="small" />}
                onClick={() => handleAddValue(optIndex)}
                sx={{ mt: 1.5 }}
              >
                Add Choice Value
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
};
