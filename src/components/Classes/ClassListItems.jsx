import React from "react";
import PropTypes from "prop-types"; // Import PropTypes
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  ListItemIcon,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import SchoolIcon from "@mui/icons-material/School";

function ClassListItems({
  classesBySemester,
  searchTerm,
  expanded,
  handleChange,
  classId,
  handleSearchChange,
  navigate,
}) {
  const { user } = useAuth();

  const formattedSemester = (semesterInt) => {
    const year = String(semesterInt).slice(0, 4);
    const semesterPart = String(semesterInt).slice(4);
    const semesterName =
      semesterPart === "3" ? "Học kỳ Hè" : `Học kỳ ${semesterPart}`;
    return `${year} - ${semesterName}`;
  };

  if (!classesBySemester || Object.keys(classesBySemester).length === 0) {
    return (
      <Typography variant="body1" align="center" sx={{ mt: 2 }}>
        Không có lớp học nào.
      </Typography>
    );
  }

  return (
    <>
      {Object.entries(classesBySemester)
        .sort(([semesterA], [semesterB]) => semesterB - semesterA)
        .filter(([semester, classes]) => classes.length > 0)
        .map(([semester, classes]) => (
          <Accordion
            key={semester}
            expanded={expanded === semester}
            onChange={handleChange(semester)}
            sx={{
              marginBottom: "1rem",
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">
                {formattedSemester(semester)}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List sx={{ padding: 0 }}>
                {classes.map((c) => (
                  <ListItem
                    key={c.id}
                    disablePadding
                    secondaryAction={
                      user?.role === "lecturer" && (
                        <Button
                          component={RouterLink}
                          to={`/classes/${c.id}/edit`} // Thêm route chỉnh sửa lớp học
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<EditIcon />}
                        >
                          Edit
                        </Button>
                      )
                    }
                  >
                    <ListItemButton
                      onClick={() => navigate(`/classes/${c.id}`)}
                    >
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <>
                            <Typography variant="body1">
                              {c.subjects.subject_code} - {c.name} (Mã lớp:{" "}
                              {c.class_code})
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Giảng viên: {c.lecturer?.full_name}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
    </>
  );
}

export default ClassListItems;
