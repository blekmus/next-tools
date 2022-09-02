import {
  Text,
  createStyles,
} from '@mantine/core'
import Link from 'next/link';

const useStyles = createStyles((theme, { opened }: { opened: boolean }) => ({
  link: {
    display: 'block',
    textDecoration: 'none',
    padding: `${theme.spacing.xs}px ${theme.spacing.md}px`,
    paddingLeft: 31,
    marginLeft: 30,
    fontSize: theme.fontSizes.sm,
    borderLeft: `1px solid ${theme.colors.dark[4]}`,
    color: opened ? theme.colors.gray[1] : theme.colors.dark[0],
    fontWeight: opened ? 600 : 500,

    '&:hover': {
      backgroundColor: theme.colors.dark[7],
      color: theme.white,
    },
  },
}))

interface LinksGroupProps {
  link: { label: string; link: string, id: string }
  opened: boolean
}

const LinksSubGroup = ({
  link,
  opened
}: LinksGroupProps) => {
  const { classes } = useStyles({ opened })

  return (
    <Link href={link.link}>
      <Text
        component="a"
        href={link.link}
        key={link.label}
        className={classes.link}
      >
        {link.label}
      </Text>
    </Link>
  )
}

export default LinksSubGroup
