import React, { useState, useEffect } from 'react';
import { SearchIcon, ChevronRightIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { apiService, DashboardData, HierarchyNode, Device } from '../../services/api';

interface DashboardSidebarProps {
  onDeviceSelect?: (device: Device) => void;
  onHierarchySelect?: (hierarchy: HierarchyNode) => void;
  selectedDeviceId?: string | null;
  selectedHierarchyId?: string | null;
  onInitialHierarchyLoad?: (hierarchy: HierarchyNode) => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  onDeviceSelect, 
  onHierarchySelect,
  selectedDeviceId,
  selectedHierarchyId,
  onInitialHierarchyLoad,
}) => {

  const { token } = useAuth();
  const { theme } = useTheme();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesByHierarchy, setDevicesByHierarchy] = useState<Record<string, Device[]>>({});

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) return;
      
      try {
        const response = await apiService.getDashboardData(token);
        if (response.success && response.data) {
          setDashboardData(response.data);
          
          // Auto-expand first company and its first region/area
          const companyName = Object.keys(response.data.hierarchy)[0];
          if (companyName) {
            const hierarchy = response.data.hierarchy[companyName].hierarchy;
            const expanded = [companyName];
            
            if (hierarchy.length > 0) {
              expanded.push(hierarchy[0].id);
              
              // Auto-select the first hierarchy node for initial chart loading
              if (onInitialHierarchyLoad) {
                onInitialHierarchyLoad(hierarchy[0]);
              }
              
              if (hierarchy[0].children.length > 0) {
                expanded.push(hierarchy[0].children[0].id);
                if (hierarchy[0].children[0].children.length > 0) {
                  expanded.push(hierarchy[0].children[0].children[0].id);
                }
              }
            }
            
            setExpandedItems(expanded);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      }
    };

    const loadDevices = async () => {
      if (!token) return;
      
      try {
        const response = await apiService.getAllDevices(token);
        if (response.success && response.data) {
          setDevices(response.data.devices);
          
          // Group devices by their hierarchy location
          const deviceGroups: Record<string, Device[]> = {};
          response.data.devices.forEach(device => {
            // For now, we'll group devices by their location name
            // In a real scenario, you'd want to group by hierarchy ID
            const locationKey = device.location || 'unassigned';
            if (!deviceGroups[locationKey]) {
              deviceGroups[locationKey] = [];
            }
            deviceGroups[locationKey].push(device);
          });
          
          setDevicesByHierarchy(deviceGroups);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
      }
    };

    loadDashboardData();
    loadDevices();
  }, [token]);

  const toggleExpanded = (id: string) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleDeviceClick = (device: Device) => {
    if (onDeviceSelect) {
      onDeviceSelect(device);
    }
  };

  const handleHierarchyClick = (hierarchy: HierarchyNode) => {
    if (onHierarchySelect) {
      onHierarchySelect(hierarchy);
    }
  };

  const getIconComponent = (level: string) => {
    const iconClass = `w-[16px] h-[16px] bg-no-repeat bg-center bg-contain filter brightness-0 invert`;
    
    switch (level) {
      case "Region":
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDI0IiBoZWlnaHQ9IjEwMjQiIHZpZXdCb3g9IjAgMCAxMDI0IDEwMjQiPjxwYXRoIGZpbGw9ImN1cnJlbnRDb2xvciIgZD0iTTg1NC40IDgwMC45Yy4yLS4zLjUtLjYuNy0uOUM5MjAuNiA3MjIuMSA5NjAgNjIxLjcgOTYwIDUxMnMtMzkuNC0yMTAuMS0xMDQuOC0yODhjLS4yLS4zLS41LS41LS43LS44Yy0xLjEtMS4zLTIuMS0yLjUtMy4yLTMuN2MtLjQtLjUtLjgtLjktMS4yLTEuNGwtNC4xLTQuN2wtLjEtLjFjLTEuNS0xLjctMy4xLTMuNC00LjYtNS4xbC0uMS0uMWMtMy4yLTMuNC02LjQtNi44LTkuNy0xMC4xbC0uMS0uMWwtNC44LTQuOGwtLjMtLjNjLTEuNS0xLjUtMy0yLjktNC41LTQuM2MtLjUtLjUtMS0xLTEuNi0xLjVjLTEtMS0yLTEuOS0zLTIuOGMtLjMtLjMtLjctLjYtMS0xQzczNi40IDEwOS4yIDYyOS41IDY0IDUxMiA2NHMtMjI0LjQgNDUuMi0zMDQuMyAxMTkuMmMtLjMuMy0uNy42LTEgMWMtMSAuOS0yIDEuOS0zIDIuOWMtLjUuNS0xIDEtMS42IDEuNWMtMS41IDEuNC0zIDIuOS00LjUgNC4zbC0uMy4zbC00LjggNC44bC0uMS4xYy0zLjMgMy4zLTYuNSA2LjctOS43IDEwLjFsLS4xLjFjLTEuNiAxLjctMy4xIDMuNC00LjYgNS4xbC0uMS4xYy0xLjQgMS41LTIuOCAzLjEtNC4xIDQuN2MtLjQuNS0uOC45LTEuMiAxLjRjLTEuMSAxLjItMi4xIDIuNS0zLjIgMy43Yy0uMi4zLS41LjUtLjcuOEMxMDMuNCAzMDEuOSA2NCA0MDIuMyA2NCA1MTJzMzkuNCAyMTAuMSAxMDQuOCAyODhjLjIuMy41LjYuNy45bDMuMSAzLjdjLjQuNS44LjkgMS4yIDEuNGw0LjEgNC43YzAgLjEuMS4xLjEuMmMxLjUgMS43IDMgMy40IDQuNiA1bC4xLjFjMy4yIDMuNCA2LjQgNi44IDkuNiAxMC4xbC4xLjFjMS42IDEuNiAzLjEgMy4yIDQuNyA0LjdsLjMuM2MzLjMgMy4zIDYuNyA2LjUgMTAuMSA5LjZjODAuMSA3NCAxODcgMTE5LjIgMzA0LjUgMTE5LjJzMjI0LjQtNDUuMiAzMDQuMy0xMTkuMmEzMDAgMzAwIDAgMCAwIDEwLTkuNmwuMy0uM2MxLjYtMS42IDMuMi0zLjEgNDcuNy00LjdsLjEtLjFjMy4zLTMuMyA2LjUtNi43IDkuNi0xMC4xbC4xLS4xYzEuNS0xLjcgMy4xLTMuMyA0LjYtNWMwLS4xLjEtLjEuMS0uMmMxLjQtMS41IDIuOC0zLjEgNC4xLTQuN2MuNC0uNS44LS45IDEuMi0xLjRhOTkgOTkgMCAwIDAgMy4zLTMuN200LjEtMTQyLjZjLTEzLjggMzIuNi0zMiA2Mi44LTU0LjIgOTAuMmE0NDQgNDQ0IDAgMCAwLTgxLjUtNTUuOWMxMS42LTQ2LjkgMTguOC05OC40IDIwLjctMTUyLjZIODg3Yy0zIDQwLjktMTIuNiA4MC42LTI4LjUgMTE4LjNNODg3IDQ4NEg3NDMuNWMtMS45LTU0LjItOS4xLTEwNS43LTIwLjctMTUyLjZjMjkuMy0xNS42IDU2LjYtMzQuNCA4MS41LTU1LjlBMzczLjg2IDM3My44NiAwIDAgMSA4ODcgNDg0TTY1OC4zIDE2NS41YzM5LjcgMTYuOCA3NS44IDQwIDEwNy42IDY5LjJhMzk0LjcgMzk0LjcgMCAwIDEtNTkuNCA0MS44Yy0xNS43LTQ1LTM1LjgtODQuMS01OS4yLTExNS40YzMuNyAxLjQgNy40IDIuOSAxMSA0LjRtLTkwLjYgNzAwLjZjLTkuMiA3LjItMTguNCA4LjctMjcuNyAxNi40VjY5N2EzODkuMSAzODkuMSAwIDAgMSAxMTUuNyAyNi4yYy04LjMgMjQuNi0xNy45IDQ3LjMtMjkgNjcuOGMtMTcuNCAzMi40LTM3LjggNTguMy01OSA3NS4xbTU5LTYzMy4xYzExIDIwLjYgMjAuNyA0My4zIDI5IDY3LjhBMzg5LjEgMzg5LjEgMCAwIDEgNTQwIDMyN1YxNDEuNmM5LjIgMy43IDE4LjUgOS4xIDI3LjcgMTYuNGMyMS4yIDE2LjcgNDEuNiA0Mi42IDU5IDc1TTU0MCA2NDAuOVY1NDBoMTQ3LjVjLTEuNiA0NC4yLTcuMSA87LjEtMTYuMyAxMjcuOGwtLjMgMS4yQTQ0NSA0NDUgMCAwIDAgNTQwIDY0MC45bTAtMTU2LjlWMzgzLjFjNDUuOC0yLjggODkuOC0xMi41IDEzMC45LTI4LjFsLjMgMS4yYzkuMiA0MC43IDE0LjcgODMuNSAxNi4zIDEyNy44em0tNTYgNTZ2MTAwLjljLTQ1LjggMi44LTg5LjggMTIuNS0xMzAuOSAyOC4xbC0uMy0xLjJjLTkuMi00MC43LTE0LjctODMuNS0xNi4zLTEyNy44em0tMTQ3LjUtNTZjMS42LTQ0LjIgNy4xLTg3LjEgMTYuMy0xMjcuOGwuMy0xLjJjNDEuMSAxNS42IDg1IDI1LjMgMTMwLjkgMjguMVY0ODR6TTQ4NCA2OTd2MTg1LjRjLTkuMi0zLjctMTguNS05LjEtMjcuNy0xNi40Yy0yMS4yLTE2LjctNDEuNy00Mi43LTU5LjEtNzUuMWMtMTEtMjAuNi0yMC43LTQzLjMtMjktNjcuOGMzNy4yLTE0LjYgNzUuOS0yMy4zIDExNS44LTI2LjFtMC0zNzBhMzg5LjEgMzg5LjEgMCAwIDEtMTE1LjctMjYuMmM4LjMtMjQuNiAxNy45LTQ3LjMgMjktNjcuOGMxNy40LTMyLjQgMzcuOC01OC40IDU5LjEtNzUuMWM5LjItNy4yIDE4LjQtMTIuNyAyNy43LTE2LjRWMzI3ek0zNjUuNyAxNjUuNWMzLjctMS41IDcuMy0zIDExLTQuNGMtMjMuNCAzMS4zLTQzLjUgNzAuNC01OS4yIDExNS40Yy0yMS0xMi00MC45LTI2LTU5LjQtNDEuOGMzMS44LTI5LjIgNjcuOS01Mi40IDEwNy42LTY5LjJNMTY1LjUgMzY1LjdjMTMuOC0zMi42IDMyLTYyLjggNTQuMi05MC4yYzI0LjkgMjEuNSA1Mi4yIDQwLjMgODEuNSA1NS45Yy0xMS42IDQ2LjktMTguOCA5OC40LTIwLjcgMTUyLjZIMTM3YzMtNDAuOSAxMi42LTgwLjYgMjguNS0xMTguM00xMzcgNTQwaDE0My41YzEuOSA1NC4yIDkuMSAxMDUuNyAyMC43IDE1Mi42YTQ0NCA0NDQgMCAwIDAtODEuNSA1NS45QTM3My44NiAzNzMuODYgMCAwIDEgMTM3IDU0MG0yMjguNyAzMTguNWMtMzkuNy0xNi44LTc1LjgtNDAtMTA3LjYtNjkuMmMxOC41LTE1LjggMzguNC0yOS43IDU5LjQtNDEuOGMxNS43IDQ1IDM1LjggODQuMSA1OS4yIDExNS40Yy0zLjctMS40LTcuNC0yLjktMTEtNC40bTI5Mi42IDBjLTMuNyAxLjUtNy4zIDMtMTEgNC40YzIzLjQtMzEuMyA0My41LTcwLjQgNTkuMi0xMTUuNGMyMSAxMiA0MC45IDI2IDU5LjQgNDEuOGEzNzMuOCAzNzMuOCAwIDAgMS0xMDcuNiA2OS4yIi8+PC9zdmc+')` 
            }}
          />
        );
      case "Area":
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLXdpZHRoPSIzMiIgZD0iTTI1NiA0OGMtNzkuNSAwLTE0NCA2MS4zOS0xNDQgMTM3YzAgODcgOTYgMjI0Ljg3IDEzMS4yNSAyNzIuNDlhMTUuNzcgMTUuNzcgMCAwIDAgMjUuNSAwQzMwNCA0MDkuODkgNDAwIDI3Mi4wNyA0MDAgMTg1YzAtNzUuNjEtNjQuNS0xMzctMTQ0LTEzNyIvPjxjaXJjbGUgY3g9IjI1NiIgY3k9IjE5MiIgcj0iNDgiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIHN0cm9rZS13aWR0aD0iMzIiLz48L3N2Zz4=')` 
            }}
          />
        );
      case "Field":
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMzI1LjkgMjMuOTgxTDMxMS45NCA0NS4yNWMzOC4xODIgMjQuODQ1IDY3LjY3NSA1OS4wMjQgOTYuODc4IDEyMy4xNzhsMTYuODI4LTI0LjgwN2MtNS4xNTUtMTcuNDAzLTEwLjgwMS0zNS44Ni0xNi01MS4zNTFjLTUuNTk3LTE2LjY4Mi0xMS41MzgtMzAuODY2LTEzLjEwNS0zMy4xOTRjLTEuMzItMS45Ni0xMC43NDgtOS40NTItMjQuNTMtMTYuMzRjLTEyLjI4NS02LjE0LTI4LjI3Mi0xMi42NTUtNDYuMTEtMTguNzU0em04LjMzIDYxLjUzbC01NC40NiA0Mi45OTRjMTAuNzYxIDYuMTc1IDE4LjUgMTcuMDgyIDIwLjMxNCAyOS44MjhsNTcuNS00NS4zOTZjLTcuNTIyLTEwLjQ4OS0xNS4yMzgtMTkuNDg1LTIzLjM1NC0yNy40MjZtLTc0LjczIDU1LjU3OGMtMTIuODEgMC0yMyAxMC4xOS0yMyAyM2MwIDEyLjgwOSAxMC4xOSAyMyAyMyAyM3MyMy0xMC4xOTEgMjMtMjNjMC0xMi44MS0xMC4xOS0yMy0yMy0yM20tMzkuMzQyIDM0LjQ3Nkw4Ny40OSAyODAuMzA0YzExLjgzOCA0LjY3IDIwLjQwNiAxNi4wMTMgMjAuOTc1IDI5LjMwNkwyNDQuNSAyMDIuMjE0Yy0xMS42NzYtNC42MzUtMjAuNzY2LTE0LjQ5Mi0yNC4zNDItMjYuNjQ5bTE3NC4zNDIgNC40NDh2MjEwLjAwNmgxOFYxOTUuMDYzbC03LjA4MiAxMC40NGwtNi40NTMtMTUuMjE5YTY4MyA2ODMgMCAwIDAtNC40NjUtMTAuMjcxbS05Mi42MzcuNTQzTDI4Ni4wNDcgMTkyLjhsMy43OTMgMTguMDE1bC0xNC41MjYtOS43MDdsLTE1LjAxIDExLjYyMWwyOC43OTYgMTkuMjQzbC03MS4zMDUgMzIuODMybDQuODItMjIuODk3bC0yMS45NzYgMTcuMDE0bC0yNC4zNTQgMTE1LjY3OGwtLjQ0LjE5NWwuMjcyLjYxbC0xOS45MiA5NC42MTVIMTQwLjV2MThoMjIyVjQ2OC41OHptLTQuMjI2IDY3LjNsMTIuMDIgNTcuMDg4bC03OS4wNTctMjYuMjE4em0tODUuNDc3IDQzLjcxN2w4Ni40MzIgMjguNjY2bC0xMDIuMDEyIDQ1LjMzOHpNNzUuNSAyOTYuMDJjLTguMzkgMC0xNSA2LjYwOS0xNSAxNXM2LjYxIDE1IDE1IDE1czE1LTYuNjEgMTUtMTVzLTYuNjEtMTUtMTUtMTVtMjM5Ljk0NSAzNi40MjdsMTQuOTUzIDcxLjAyOGwtMTExLjk1My0yNy45MTZ6bS0yMTguODI0IDMuODUyYy00LjU5NSAzLjg1MS0xMC4yNCA2LjQ4MS0xNi40MiA3LjM3N2wyMS4yNjYgNDYuMzQ0aDE5LjgwNHptLTQyLjIzMi4wMDhsLTI0LjY2IDUzLjcxM2gxOS44MDhsMjEuMjc2LTQ2LjM0MmMtNi4xODEtLjg5My0xMS44MjgtMy41MjEtMTYuNDI0LTcuMzcxbTEzNy41NzQgNTEuMmwxMTYuNzgxIDI5LjExOGwtMTMzLjEwMSA0OC40MDN6TTI4LjUgNDA4LjAxOHY2Mmg5NHYtNjJ6bTM1MiAwdjE2aDQ2di0xNnptLTQ1LjMyNCAxOC4xNWw5LjIzMiA0My44NWgtMTI5Ljgyem00NS4zMjQgMTUuODV2MjhoNDZ2LTI4em02NCAyOHYxOGgzOXYtMTh6Ii8+PC9zdmc+')` 
            }}
          />
        );
      case "Well":
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgNTEyIDUxMiI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMzI1LjkgMjMuOTgxTDMxMS45NCA0NS4yNWMzOC4xODIgMjQuODQ1IDY3LjY3NSA1OS4wMjQgOTYuODc4IDEyMy4xNzhsMTYuODI4LTI0LjgwN2MtNS4xNTUtMTcuNDAzLTEwLjgwMS0zNS44Ni0xNi01MS4zNTFjLTUuNTk3LTE2LjY4Mi0xMS41MzgtMzAuODY2LTEzLjEwNS0zMy4xOTRjLTEuMzItMS45Ni0xMC43NDgtOS40NTItMjQuNTMtMTYuMzRjLTEyLjI4NS02LjE0LTI4LjI3Mi0xMi42NTUtNDYuMTEtMTguNzU0em04LjMzIDYxLjUzbC01NC40NiA0Mi45OTRjMTAuNzYxIDYuMTc1IDE4LjUgMTcuMDgyIDIwLjMxNCAyOS44MjhsNTcuNS00NS4zOTZjLTcuNTIyLTEwLjQ4OS0xNS4yMzgtMTkuNDg1LTIzLjM1NC0yNy40MjZtLTc0LjczIDU1LjU3OGMtMTIuODEgMC0yMyAxMC4xOS0yMyAyM2MwIDEyLjgwOSAxMC4xOSAyMyAyMyAyM3MyMy0xMC4xOTEgMjMtMjNjMC0xMi44MS0xMC4xOS0yMy0yMy0yM20tMzkuMzQyIDM0LjQ3Nkw4Ny40OSAyODAuMzA0YzExLjgzOCA0LjY3IDIwLjQwNiAxNi4wMTMgMjAuOTc1IDI5LjMwNkwyNDQuNSAyMDIuMjE0Yy0xMS42NzYtNC42MzUtMjAuNzY2LTE0LjQ5Mi0yNC4zNDItMjYuNjQ5bTE3NC4zNDIgNC40NDh2MjEwLjAwNmgxOFYxOTUuMDYzbC03LjA4MiAxMC40NGwtNi40NTMtMTUuMjE5YTY4MyA2ODMgMCAwIDAtNC40NjUtMTAuMjcxbS05Mi42MzcuNTQzTDI4Ni4wNDcgMTkyLjhsMy43OTMgMTguMDE1bC0xNC41MjYtOS43MDdsLTE1LjAxIDExLjYyMWwyOC43OTYgMTkuMjQzbC03MS4zMDUgMzIuODMybDQuODItMjIuODk3bC0yMS45NzYgMTcuMDE0bC0yNC4zNTQgMTE1LjY3OGwtLjQ0LjE5NWwuMjcyLjYxbC0xOS45MiA5NC42MTVIMTQwLjV2MThoMjIyVjQ2OC41OHptLTQuMjI2IDY3LjNsMTIuMDIgNTcuMDg4bC03OS4wNTctMjYuMjE4em0tODUuNDc3IDQzLjcxN2w4Ni40MzIgMjguNjY2bC0xMDIuMDEyIDQ1LjMzOHpNNzUuNSAyOTYuMDJjLTguMzkgMC0xNSA2LjYwOS0xNSAxNXM2LjYxIDE1IDE1IDE1czE1LTYuNjEgMTUtMTVzLTYuNjEtMTUtMTUtMTVtMjM5Ljk0NSAzNi40MjdsMTQuOTUzIDcxLjAyOGwtMTExLjk1My0yNy45MTZ6bS0yMTguODI0IDMuODUyYy00LjU5NSAzLjg1MS0xMC4yNCA2LjQ4MS0xNi40MiA3LjM3N2wyMS4yNjYgNDYuMzQ0aDE5LjgwNHptLTQyLjIzMi4wMDhsLTI0LjY2IDUzLjcxM2gxOS44MDhsMjEuMjc2LTQ2LjM0MmMtNi4xODEtLjg5My0xMS44MjgtMy41MjEtMTYuNDI0LTcuMzcxbTEzNy41NzQgNTEuMmwxMTYuNzgxIDI5LjExOGwtMTMzLjEwMSA0OC40MDN6TTI4LjUgNDA4LjAxOHY2Mmg5NHYtNjJ6bTM1MiAwdjE2aDQ2di0xNnptLTQ1LjMyNCAxOC4xNWw5LjIzMiA0My44NWgtMTI5Ljgyem00NS4zMjQgMTUuODV2MjhoNDZ2LTI4em02NCAyOHYxOGgzOXYtMTh6Ii8+PC9zdmc+')` 
            }}
          />
        );
      case "Device":
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48ZyBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjIiPjxwYXRoIGQ9Ik0yMSAxN2EyIDIgMCAwIDAtMi0ySDVhMiAyIDAgMCAwLTIgMnYyYTIgMiAwIDAgMCAyIDJoMTRhMiAyIDAgMCAwIDItMnpNNiAxNXYtMm02IDJWOSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNiIgcj0iMyIvPjwvZz48L3N2Zz4=')` 
            }}
          />
        );
      default:
        return (
          <div 
            className={iconClass}
            style={{ 
              backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiLz48cGF0aCBkPSJtMTIgMSA0IDQtNCA0LTQtNCA0LTR6Ii8+PHBhdGggZD0ibTEyIDIzLTQtNCA0LTQgNCA0LTQgNHoiLz48L3N2Zz4=')` 
            }}
          />
        );
    }
  };

  const renderDevicesForHierarchy = (hierarchyName: string, level = 0) => {
    const hierarchyDevices = devicesByHierarchy[hierarchyName] || [];
    
    if (hierarchyDevices.length === 0) return null;

    return hierarchyDevices.map((device) => (
      <div
        key={`device-${device.id}`}
        className={`flex items-center gap-3 py-2 px-4 cursor-pointer transition-colors ml-8 ${
          selectedDeviceId === device.id
            ? 'bg-[#6656F5] text-white'
            : 'hover:bg-[#2A2D47] text-gray-300 hover:text-white'
        }`}
        onClick={() => handleDeviceClick(device)}
      >
        <div className="w-4"></div>
        {getIconComponent('Device')}
        <span className="text-sm flex-1">{device.serial_number}</span>
        <div className="w-2 h-2 bg-green-500 rounded-full" />
      </div>
    ));
  };

  const renderNavigationItem = (item: HierarchyNode, level = 0) => {
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const isWell = item.level === 'Well';
    const wellDevices = isWell ? devicesByHierarchy[item.name] || [] : [];
    const hasDevices = wellDevices.length > 0;
    const isSelected = selectedHierarchyId === item.id;

    const handleClick = () => {
      if (hasChildren || hasDevices) {
        toggleExpanded(item.id);
      }
      // Always call hierarchy select when clicking on any hierarchy node
      handleHierarchyClick(item);
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-3 py-2 px-4 cursor-pointer transition-colors ${
            isSelected
              ? 'bg-[#6366F1] text-white'
              : 'hover:bg-[#2A2D47] text-gray-300 hover:text-white'
          } ${
            level === 0
              ? 'font-medium'
              : level === 1
              ? 'ml-4'
              : level === 2
              ? 'ml-6'
              : 'ml-8'
          }`}
          onClick={handleClick}
        >
          {(hasChildren || hasDevices) && (
            <ChevronRightIcon
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              } text-gray-400`}
            />
          )}
          {!hasChildren && !hasDevices && <div className="w-4"></div>}

          {getIconComponent(item.level)}

          <span className="text-sm flex-1">{item.name}</span>

          {isWell && hasDevices && (
            <span className="text-xs px-2 py-1 rounded-full bg-[#6366F1] text-white">
              {wellDevices.length}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {item.children.map((child: HierarchyNode) =>
              renderNavigationItem(child, level + 1)
            )}
          </div>
        )}

        {isWell && hasDevices && isExpanded && (
          <div>
            {renderDevicesForHierarchy(item.name, level + 1)}
          </div>
        )}
      </div>
    );
  };

  const renderCompanyHierarchy = () => {
    if (!dashboardData?.hierarchy) return null;

    return Object.entries(dashboardData.hierarchy).map(
      ([companyName, companyData]) => {
        const isExpanded = expandedItems.includes(companyName);
        const isSelected = selectedHierarchyId === companyName;

        return (
          <div key={companyName}>
            <div
              className={`flex items-center gap-3 py-2 px-4 cursor-pointer transition-colors font-medium ${
                isSelected
                  ? 'bg-[#6366F1] text-white'
                  : 'hover:bg-[#2A2D47] text-gray-300 hover:text-white'
              }`}
              onClick={() => {
                toggleExpanded(companyName);
                // Create a company hierarchy node for selection
                const companyHierarchy: HierarchyNode = {
                  id: companyName,
                  name: companyName,
                  level: 'Company',
                  level_order: 0,
                  can_attach_device: false,
                  children: companyData.hierarchy,
                  company_id: companyData.id
                };
                handleHierarchyClick(companyHierarchy);
              }}
            >
              <ChevronRightIcon
                className={`w-4 h-4 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                } text-gray-400`}
              />
              <div
                className="w-[16px] h-[16px] bg-no-repeat bg-center bg-contain filter brightness-0 invert"
                style={{
                  backgroundImage: `url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxwYXRoIGQ9Im0zIDkgOS03IDkgNy05IDEzLTkgN3oiLz48L3N2Zz4=')`,
                }}
              />
              <span className="text-sm">{companyName}</span>
            </div>

            {isExpanded && (
              <div>
                {companyData.hierarchy.map((item: HierarchyNode) =>
                  renderNavigationItem(item, 1)
                )}
              </div>
            )}
          </div>
        );
      }
    );
  };

  return (
    <div className="w-64 bg-[#1E1F2E] border-r border-[#2A2D47]">
      <div className="p-4">
        <h1 className="text-white text-base font-medium mb-4 tracking-wider">
          Production Map
        </h1>

        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search"
            className="w-full pl-10 h-9 rounded-lg border bg-[#2A2D47] border-[#3A3D57] text-white placeholder-gray-400 focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      <div className="border-t border-[#2A2D47]">
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          {renderCompanyHierarchy()}
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;