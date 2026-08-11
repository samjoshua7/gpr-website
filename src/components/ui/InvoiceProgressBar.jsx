import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';

const DEFAULT_WORKFLOW = [
  'New Orders',
  'Designing',
  'Proof',
  'Printing',
  'Additional works',
  'Cutting',
  'Packing',
  'Out for Delivery',
  'Delivered',
];

const getProgressColor = (fraction) => {
  if (fraction >= 1) return '#2e7d32'; // Green (Completed/Delivered)
  if (fraction >= 0.6) return '#0288d1'; // Blue (Late stage)
  if (fraction >= 0.3) return '#ed6c02'; // Amber (Mid stage)
  return '#d32f2f'; // Red (Early stage)
};

export const InvoiceProgressBar = ({
  taskStatuses = [],
  workflow = DEFAULT_WORKFLOW,
  height = 10,
  showLabel = false,
}) => {
  const activeWorkflow = workflow && workflow.length > 0 ? workflow : DEFAULT_WORKFLOW;

  if (!taskStatuses || taskStatuses.length === 0) {
    return (
      <Tooltip title="No production tasks linked">
        <Box
          sx={{
            width: '100%',
            height,
            bgcolor: 'action.disabledBackground',
            borderRadius: height / 2,
          }}
        />
      </Tooltip>
    );
  }

  const segmentCount = taskStatuses.length;

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Box
        sx={{
          display: 'flex',
          gap: segmentCount > 1 ? '3px' : 0,
          width: '100%',
          alignItems: 'center',
        }}
      >
        {taskStatuses.map((item, idx) => {
          const stageIdx = activeWorkflow.indexOf(item.status);
          const fraction = stageIdx >= 0 ? (stageIdx + 1) / activeWorkflow.length : 0;
          const percent = Math.round(fraction * 100);
          const fillColor = getProgressColor(fraction);
          const productName = item.product_name || `Item ${idx + 1}`;
          const tooltipTitle = `${productName}: ${item.status || 'Pending'} (${percent}%)`;

          return (
            <Tooltip key={item.task_id || idx} title={tooltipTitle} arrow placement="top">
              <Box
                sx={{
                  flex: 1,
                  height,
                  bgcolor: 'action.hover',
                  borderRadius: height / 2,
                  overflow: 'hidden',
                  position: 'relative',
                  border: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <Box
                  sx={{
                    width: `${percent}%`,
                    height: '100%',
                    bgcolor: fillColor,
                    borderRadius: height / 2,
                    transition: 'width 0.3s ease-in-out',
                  }}
                />
              </Box>
            </Tooltip>
          );
        })}
      </Box>

      {showLabel && (
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {segmentCount} line {segmentCount === 1 ? 'item' : 'items'}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InvoiceProgressBar;
