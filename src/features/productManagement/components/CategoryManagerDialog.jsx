import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { CategoryFormDialog } from './CategoryFormDialog';
import { createCategory, updateCategory, deleteCategory } from '../api';
import { CategoryIcon } from '../../../components/common/CategoryIcon';

export const CategoryManagerDialog = ({ open, onClose, categories = [], onRefresh }) => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const handleCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingCategory) {
      await updateCategory(editingCategory.category_id, formData);
    } else {
      await createCategory(formData);
    }
    await onRefresh();
  };

  const handleDelete = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Products in this category will become unassigned.')) {
      await deleteCategory(categoryId);
      await onRefresh();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>Manage Product Categories</Typography>
            <Typography variant="caption" color="text.secondary">
              Organize products into storefront catalog categories
            </Typography>
          </Box>
          <Button
            size="small"
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
          >
            Add Category
          </Button>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '10%' }}>Icon</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '30%' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '25%' }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '15%' }}>Order</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '10%' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '10%' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.category_id} hover>
                  <TableCell>
                    <CategoryIcon
                      slug={cat.slug}
                      name={cat.name}
                      iconKey={cat.icon}
                      sx={{ fontSize: '1.4rem', color: 'primary.main', display: 'inline-flex', verticalAlign: 'middle' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{cat.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {cat.slug}
                  </TableCell>
                  <TableCell>{cat.display_order}</TableCell>
                  <TableCell>
                    <Chip
                      label={cat.active ? 'Active' : 'Inactive'}
                      size="small"
                      color={cat.active ? 'success' : 'default'}
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Category">
                      <IconButton size="small" onClick={() => handleEdit(cat)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Category">
                      <IconButton size="small" color="error" onClick={() => handleDelete(cat.category_id)}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <CategoryFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialData={editingCategory}
      />
    </>
  );
};
