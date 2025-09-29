import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
} from '@mui/material';
import {
  Dashboard,
  Folder,
  AccountTree,
  Timeline,
  People,
  Assessment,
  ExpandLess,
  ExpandMore,
  Add,
  FolderOpen,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setCurrentView } from '../../store/slices/appSlice';

interface SidebarProps {
  open: boolean;
}

/**
 * サイドバーナビゲーションコンポーネント
 * アプリケーションの主要な画面への遷移を提供
 */
const Sidebar: React.FC<SidebarProps> = ({ open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { currentProject } = useSelector((state: RootState) => ({
    currentProject: state.project.currentProject,
  }));

  const [projectMenuOpen, setProjectMenuOpen] = React.useState(true);

  const handleNavigation = (path: string, view: string) => {
    navigate(path);
    dispatch(setCurrentView(view as any));
  };

  const isActive = (path: string) => location.pathname === path;

  // サイドバーの幅
  const drawerWidth = open ? 280 : 64;

  return (
    <Drawer
      variant="permanent"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          top: '64px', // ヘッダーの高さ分下げる
          height: 'calc(100vh - 64px)',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          overflowX: 'hidden',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {/* ダッシュボード */}
          <ListItem disablePadding>
            <ListItemButton
              selected={isActive('/')}
              onClick={() => handleNavigation('/', 'dashboard')}
            >
              <ListItemIcon>
                <Dashboard color={isActive('/') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {open && <ListItemText primary="ダッシュボード" />}
            </ListItemButton>
          </ListItem>

          {/* プロジェクト一覧 */}
          <ListItem disablePadding>
            <ListItemButton
              selected={isActive('/projects')}
              onClick={() => handleNavigation('/projects', 'projects')}
            >
              <ListItemIcon>
                <Folder color={isActive('/projects') ? 'primary' : 'inherit'} />
              </ListItemIcon>
              {open && <ListItemText primary="プロジェクト一覧" />}
            </ListItemButton>
          </ListItem>

          <Divider sx={{ margin: '8px 0' }} />

          {/* 現在のプロジェクトメニュー */}
          {currentProject && (
            <>
              {/* プロジェクト名表示 */}
              {open && (
                <Box sx={{ padding: '8px 16px' }}>
                  <Typography variant="body2" color="text.secondary">
                    現在のプロジェクト
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {currentProject.name}
                  </Typography>
                </Box>
              )}

              {/* プロジェクトメニューの展開/折りたたみ */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setProjectMenuOpen(!projectMenuOpen)}
                >
                  <ListItemIcon>
                    <FolderOpen />
                  </ListItemIcon>
                  {open && (
                    <>
                      <ListItemText primary="プロジェクト" />
                      {projectMenuOpen ? <ExpandLess /> : <ExpandMore />}
                    </>
                  )}
                </ListItemButton>
              </ListItem>

              {/* プロジェクト関連メニュー */}
              <Collapse in={projectMenuOpen && open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {/* WBS管理 */}
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={isActive(`/projects/${currentProject.id}/wbs`)}
                      onClick={() =>
                        handleNavigation(`/projects/${currentProject.id}/wbs`, 'wbs')
                      }
                    >
                      <ListItemIcon>
                        <AccountTree
                          color={
                            isActive(`/projects/${currentProject.id}/wbs`)
                              ? 'primary'
                              : 'inherit'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText primary="WBS管理" />
                    </ListItemButton>
                  </ListItem>

                  {/* ガントチャート */}
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={isActive(`/projects/${currentProject.id}/gantt`)}
                      onClick={() =>
                        handleNavigation(`/projects/${currentProject.id}/gantt`, 'gantt')
                      }
                    >
                      <ListItemIcon>
                        <Timeline
                          color={
                            isActive(`/projects/${currentProject.id}/gantt`)
                              ? 'primary'
                              : 'inherit'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText primary="ガントチャート" />
                    </ListItemButton>
                  </ListItem>

                  {/* リソース管理 */}
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={isActive(`/projects/${currentProject.id}/resources`)}
                      onClick={() =>
                        handleNavigation(
                          `/projects/${currentProject.id}/resources`,
                          'resources'
                        )
                      }
                    >
                      <ListItemIcon>
                        <People
                          color={
                            isActive(`/projects/${currentProject.id}/resources`)
                              ? 'primary'
                              : 'inherit'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText primary="リソース管理" />
                    </ListItemButton>
                  </ListItem>

                  {/* レポート */}
                  <ListItem disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={isActive(`/projects/${currentProject.id}/reports`)}
                      onClick={() =>
                        handleNavigation(
                          `/projects/${currentProject.id}/reports`,
                          'reports'
                        )
                      }
                    >
                      <ListItemIcon>
                        <Assessment
                          color={
                            isActive(`/projects/${currentProject.id}/reports`)
                              ? 'primary'
                              : 'inherit'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText primary="レポート" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>

              <Divider sx={{ margin: '8px 0' }} />
            </>
          )}

          {/* 新規プロジェクト作成 */}
          <ListItem disablePadding>
            <ListItemButton
              onClick={() => handleNavigation('/projects/new', 'projects')}
            >
              <ListItemIcon>
                <Add />
              </ListItemIcon>
              {open && <ListItemText primary="新規プロジェクト" />}
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;