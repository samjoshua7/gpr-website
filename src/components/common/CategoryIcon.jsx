import React from 'react';
import ContactPageOutlinedIcon from '@mui/icons-material/ContactPageOutlined';
import CelebrationOutlinedIcon from '@mui/icons-material/CelebrationOutlined';
import PanoramaOutlinedIcon from '@mui/icons-material/PanoramaOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FeedOutlinedIcon from '@mui/icons-material/FeedOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import AutoStoriesOutlinedIcon from '@mui/icons-material/AutoStoriesOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

export const getCategoryIconComponent = (slugOrName = '') => {
  const normalized = String(slugOrName).toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalized.includes('visiting') || normalized.includes('card')) {
    return ContactPageOutlinedIcon;
  }
  if (normalized.includes('wedding') || normalized.includes('invite') || normalized.includes('marriage')) {
    return CelebrationOutlinedIcon;
  }
  if (normalized.includes('flex') || normalized.includes('banner') || normalized.includes('sign')) {
    return PanoramaOutlinedIcon;
  }
  if (normalized.includes('stationery') || normalized.includes('letterhead') || normalized.includes('envelope')) {
    return DescriptionOutlinedIcon;
  }
  if (normalized.includes('flyer') || normalized.includes('pamphlet') || normalized.includes('brochure')) {
    return FeedOutlinedIcon;
  }
  if (normalized.includes('notice') || normalized.includes('poster')) {
    return CampaignOutlinedIcon;
  }
  if (normalized.includes('book') || normalized.includes('catalog') || normalized.includes('binding')) {
    return AutoStoriesOutlinedIcon;
  }
  if (normalized.includes('cert') || normalized.includes('diploma') || normalized.includes('award')) {
    return WorkspacePremiumOutlinedIcon;
  }

  return Inventory2OutlinedIcon;
};

export const CategoryIcon = ({ slug, name, iconKey, sx = {}, fontSize = 'inherit', color = 'inherit' }) => {
  const IconComponent = getCategoryIconComponent(slug || iconKey || name);
  return <IconComponent sx={{ fontSize, color, ...sx }} />;
};
