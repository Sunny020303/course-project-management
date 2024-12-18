import React, { useState, useEffect } from "react";
import {
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  IconButton,
  ListItemIcon,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

function ClassListItems({
  classesBySemester,
  classId,
  handleClassClick,
  error,
  fetchClasses,
  searchTerm,
}) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(
    Object.keys(classesBySemester).sort((a, b) => b - a)[0] || false
  );

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {}, [user]);

  useEffect(() => {
    if (searchTerm) {
      setExpanded(Object.keys(classesBySemester));
    } else if (
      !expanded &&
      classesBySemester &&
      Object.keys(classesBySemester).length > 0
    ) {
      setExpanded(Object.keys(classesBySemester).sort((a, b) => b - a)[0]);
    } else if (
      expanded.length > 0 &&
      searchTerm === "" &&
      !Array.isArray(expanded)
    ) {
      setExpanded(expanded);
    }
  }, [searchTerm, classesBySemester, expanded]);

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

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchClasses}>
            Tải lại
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <>
      {Object.entries(classesBySemester)
        .sort(([semesterA], [semesterB]) => semesterB - semesterA)
        .map(([semester, classes]) => (
          <Accordion
            key={semester}
            expanded={Array.isArray(expanded) ? true : expanded === semester}
            onChange={handleChange(semester)}
            sx={{ marginBottom: "1rem", boxShadow: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
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
                      (user?.role === "lecturer" || user?.role === "admin") && (
                        <IconButton
                          component={RouterLink}
                          to={`/classes/${c.id}/edit`}
                          size="small"
                          color="primary"
                          title="Edit"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <EditIcon />
                        </IconButton>
                      )
                    }
                    sx={{
                      bgcolor:
                        classId && classId === c.id
                          ? "action.hover"
                          : "transparent",
                      "&:hover": {
                        bgcolor: "action.hover",
                        cursor: "pointer",
                      },
                    }}
                  >
                    <ListItemButton onClick={() => handleClassClick(c.id)}>
                      <ListItemIcon>
                        <SchoolIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <>
                            <Typography variant="body1">
                              <b>{c.subjects.subject_code}:</b> {c.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              Mã lớp: {c.class_code}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Giảng viên: {c.lecturer?.full_name}
                            </Typography>
                          </>
                        }
                      />
                      <IconButton
                        edge="end"
                        aria-label="View details"
                        component={RouterLink}
                        to={`/classes/${c.id}`}
                        size="small"
                        color="primary"
                        title="View Details"
                        sx={{ marginLeft: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <VisibilityIcon />
                      </IconButton>
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
